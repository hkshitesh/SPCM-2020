provider "aws"{
    region="us-east-1"
    access_key="******************"
    secret_key="****************************"
}

resource "aws_vpc" "main"{
    cidr_block = "132.0.0.0/16"
    tags = {
        Name=var.vpc_name
    }
}

resource "aws_subnet" "main" {
  count = 2
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  map_public_ip_on_launch=true
  tags = {
    Name = var.subnet_name
  }
}

resource "aws_internet_gateway" "internetgateway" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route" "internet_access" {
  route_table_id = aws_vpc.main.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id = aws_internet_gateway.internetgateway.id  
}

resource "aws_security_group" "accessgroups" {
  name = "allowinbound"
  vpc_id = aws_vpc.main.id 
  ingress {
    cidr_blocks=["0.0.0.0/0"]
    from_port=0
    to_port=65535
    protocol="tcp"
  }
  ingress {
    cidr_blocks=["0.0.0.0/0"]
    from_port=0
    to_port=0
    protocol=-1
  } 
  tags = {
    Name = "ECS-Access"
  }

}

data "aws_iam_policy_document" "ecs_task_execution_role" {
  version = "2012-10-17"
  statement {
    sid = ""
    effect = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ECS task execution role
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "MyEcsTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

# ECS task execution role policy attachment
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_cluster" "nodecluster" {
  name = "sysprov"
}

resource "aws_ecs_task_definition" "flaskapp" {
  family                = "service"
  container_definitions = file("service.json")
  execution_role_arn=aws_iam_role.ecs_task_execution_role.arn
  network_mode="awsvpc"
  requires_compatibilities=["FARGATE"]
  memory="1024"
  cpu="512"
}

resource "aws_ecs_service" "main" {
  name = "service-ecs"
  cluster = aws_ecs_cluster.nodecluster.name
  task_definition = aws_ecs_task_definition.flaskapp.arn
  launch_type = "FARGATE"
  network_configuration {
    security_groups = [aws_security_group.accessgroups.id]
    subnets = aws_subnet.main.*.id
    assign_public_ip = true
  }
  depends_on=[aws_iam_role_policy_attachment.ecs_task_execution_role]
}
