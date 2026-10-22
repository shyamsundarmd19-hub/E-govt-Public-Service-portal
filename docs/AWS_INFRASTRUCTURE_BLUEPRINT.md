# CloudGov — AWS Free Tier Infrastructure Blueprint
> **Architectural Specification & DevOps Deployment Runbook (Docker-Free Direct Hosting)**

---

## 1. Architectural Topology & Cost Model

CloudGov is engineered to operate strictly within the **AWS Free Tier** envelope ($0/month for 12 months) by eliminating container daemon overhead and maximizing native Linux kernel capabilities.

```mermaid
graph TD
    User([Citizens & Public Verifiers]) -->|Route 53 DNS| ALB[AWS Application Load Balancer]
    
    subgraph VPC["Virtual Private Cloud (VPC: 10.0.0.0/16)"]
        subgraph PublicSubnet["Public Subnets (us-east-1a, us-east-1b)"]
            ALB -->|HTTP Port 80| Nginx[Nginx Reverse Proxy]
        end
        
        subgraph AppTier["EC2 Auto Scaling Group (t2.micro / t3.micro)"]
            Nginx -->|/ (Static SPA)| WebRoot["/var/www/cloudgov (React Build)"]
            Nginx -->|/api/* (Port 8000)| Gunicorn["Gunicorn + Uvicorn Workers (2x)"]
            Gunicorn --> FastAPI[FastAPI Core Backend Engine]
        end

        subgraph DataTier["Managed Storage & State Layer"]
            FastAPI -->|PostgreSQL 5432| RDS[(AWS RDS db.t3.micro / db.t4g.micro)]
            FastAPI -->|Boto3 / SSE-S3| S3[(S3 Document Vault - Block Public Access)]
            FastAPI -->|Boto3 / TLS| SES[AWS SES Notifications]
        end
    end

    subgraph Monitoring["Observability & Alarms"]
        AppTier --> CloudWatch[CloudWatch Metrics & Alarms]
        ALB --> CloudWatch
        CloudWatch --> SNS[AWS SNS Alert Topic]
    end
```

### AWS Free Tier Resource Allocation

| AWS Component | Free Tier Monthly Allowance | CloudGov Utilization Strategy |
|---|---|---|
| **Amazon EC2** | 750 hours/month of `t2.micro` or `t3.micro` | Single instance base (ASG min:1, max:2), 2GB swap space to prevent OOM |
| **AWS RDS** | 750 hours/month of `db.t3.micro` PostgreSQL + 20GB SSD | Connection pooling (10 connections max) with pre-ping validation |
| **Amazon S3** | 5 GB Standard Storage + 20,000 GET + 2,000 PUT | Citizen document vault with client-side presigned PUT URLs |
| **Application Load Balancer** | 750 hours shared with EC2 / Free Trial | Port 80/443 termination with health checks pointing to `/api/health` |
| **AWS CloudWatch** | 10 Metrics + 10 Alarms + 1 Million API requests | Alarms for CPU > 80% and HTTP 5xx Error rates |
| **Amazon SES** | 62,000 outbound emails/month (when sent from EC2) | Automated status change and issuance alerts |

---

## 2. Infrastructure as Code (AWS CLI Deployment Runbook)

### 2.1 Virtual Private Cloud (VPC) & Security Groups Setup

```bash
# 1. Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=cloudgov-vpc

# 2. Create Security Group for ALB
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name cloudgov-alb-sg \
    --description "Security group for CloudGov ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# 3. Create Security Group for EC2 Backend
EC2_SG_ID=$(aws ec2 create-security-group \
    --group-name cloudgov-ec2-sg \
    --description "Security group for CloudGov EC2 Host" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text)

# Allow HTTP traffic only from ALB
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 80 --source-group $ALB_SG_ID
# Allow SSH for administration
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 22 --cidr YOUR_OFFICE_IP/32
```

---

### 2.2 EC2 Launch Template & UserData Automation

Create a `user_data.sh` script to automatically bootstrap newly scaled EC2 instances:

```bash
#!/bin/bash
set -e
# Update and install git
apt-get update -y && apt-get install -y git

# Clone repository
git clone https://github.com/your-org/cloudgov.git /home/ubuntu/cloudgov
chown -R ubuntu:ubuntu /home/ubuntu/cloudgov

# Run automatic system provisioning script
chmod +x /home/ubuntu/cloudgov/scripts/*.sh
/home/ubuntu/cloudgov/scripts/setup_ec2.sh
```

Encode the UserData and create the Launch Template:

```bash
USER_DATA_B64=$(base64 -w 0 user_data.sh)

aws ec2 create-launch-template \
    --launch-template-name CloudGov-Template-v1 \
    --version-description "CloudGov Native Host Template" \
    --launch-template-data "{
        \"ImageId\": \"ami-0c7217cdde317cfec\",
        \"InstanceType\": \"t2.micro\",
        \"KeyName\": \"cloudgov-ec2-key\",
        \"SecurityGroupIds\": [\"$EC2_SG_ID\"],
        \"UserData\": \"$USER_DATA_B64\",
        \"IamInstanceProfile\": {
            \"Name\": \"CloudGovEC2RoleProfile\"
        },
        \"TagSpecifications\": [
            {
                \"ResourceType\": \"instance\",
                \"Tags\": [{\"Key\": \"Name\", \"Value\": \"CloudGov-Worker\"}]
            }
        ]
    }"
```

---

### 2.3 Application Load Balancer & Auto Scaling Group (ASG)

```bash
# 1. Create Target Group
TG_ARN=$(aws elbv2 create-target-group \
    --name cloudgov-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --health-check-path /api/health \
    --health-check-interval-seconds 30 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

# 2. Create Application Load Balancer
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name cloudgov-alb \
    --subnets SUBNET_ID_1 SUBNET_ID_2 \
    --security-groups $ALB_SG_ID \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# 3. Create HTTP Listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN

# 4. Create Auto Scaling Group (Free Tier Guardrails: Min 1, Max 2)
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name cloudgov-asg \
    --launch-template LaunchTemplateName=CloudGov-Template-v1,Version='$Latest' \
    --min-size 1 \
    --max-size 2 \
    --desired-capacity 1 \
    --target-group-arns $TG_ARN \
    --vpc-zone-identifier "SUBNET_ID_1,SUBNET_ID_2"
```

---

## 3. S3 Document Vault Security Policy

The CloudGov S3 Document Vault strictly enforces **SSE-S3 AES-256 encryption at rest**, blocks all public direct internet access, and mandates HTTPS transport.

### 3.1 Bucket Provisioning & Block Public Access

```bash
BUCKET_NAME="cloudgov-document-vault-$(aws sts get-caller-identity --query Account --output text)"

# Create Private Bucket
aws s3api create-bucket --bucket $BUCKET_NAME --region us-east-1

# Enable Server-Side Encryption (SSE-S3 AES-256) by Default
aws s3api put-bucket-encryption \
    --bucket $BUCKET_NAME \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

# Block 100% of Public Access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration '{
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }'
```

### 3.2 S3 Bucket Policy (Enforce TLS & Encrypted Uploads)

Apply the following bucket policy to mandate HTTPS transport and prevent plaintext writes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::cloudgov-document-vault/*",
        "arn:aws:s3:::cloudgov-document-vault"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    },
    {
      "Sid": "DenyUnEncryptedObjectUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::cloudgov-document-vault/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

---

## 4. IAM Least Privilege Policies (EC2 Instance Role)

The EC2 host accesses AWS resources through an attached IAM Instance Profile rather than hardcoded long-lived credentials.

### 4.1 S3 Document Vault Access Policy (`CloudGov-S3-Policy`)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowVaultBucketActions",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::cloudgov-document-vault"
    },
    {
      "Sid": "AllowVaultObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cloudgov-document-vault/*"
    }
  ]
}
```

### 4.2 SES Notification Policy (`CloudGov-SES-Policy`)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESEmailDispatch",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "notifications@cloudgov.gov"
        }
      }
    }
  ]
}
```

---

## 5. CloudWatch Alarms & Observability

### 5.1 High CPU Utilization Alarm (> 80%)

Fires if the EC2 instance CPU stays above 80% for 2 consecutive 5-minute evaluation periods:

```bash
SNS_TOPIC_ARN=$(aws sns create-topic --name cloudgov-devops-alerts --query 'TopicArn' --output text)

aws cloudwatch put-metric-alarm \
    --alarm-name "CloudGov-High-CPU-Utilization" \
    --alarm-description "Alarm when CPU exceeds 80% for 10 minutes on Free Tier host" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80.0 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=AutoScalingGroupName,Value=cloudgov-asg \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN
```

### 5.2 ALB High 5xx HTTP Error Rate Alarm

Triggers if the Application Load Balancer registers more than 10 internal server errors (5xx) within a 5-minute window:

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name "CloudGov-High-5XX-Errors" \
    --alarm-description "Triggers if backend service fails or experiences database disconnects" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 300 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=LoadBalancer,Value="app/cloudgov-alb/$(echo $ALB_ARN | awk -F'/' '{print $NF}')" \
    --evaluation-periods 1 \
    --alarm-actions $SNS_TOPIC_ARN
```
