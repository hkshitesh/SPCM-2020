### Network Block ###
## Define our VPC
resource "aws_vpc" "elbvpc" {
  cidr_block = var.vpc_cidr
  enable_dns_hostnames = true

  tags = {
    Name = "elbvpc"
  }
}
## Define the public subnet
resource "aws_subnet" "public-subnet" {
  vpc_id = aws_vpc.elbvpc.id
  cidr_block = var.public_subnet_cidr
  availability_zone = "us-west-2a"

  tags = {
    Name = "lb_Public_Subnet"
  }
}
## Define the internet gateway
resource "aws_internet_gateway" "lbgw" {
  vpc_id = aws_vpc.elbvpc.id

  tags = {
    Name = "VPC_LB_IGW"
  }
}
## Define the route table
resource "aws_route_table" "public-rt" {
  vpc_id = aws_vpc.elbvpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lbgw.id
  }

  tags = {
    Name = "Public_Subnet_RT"
  }
}

## Assign the route table to the public Subnet
resource "aws_route_table_association" "public-rt" {
  subnet_id = aws_subnet.public-subnet.id
  route_table_id = aws_route_table.public-rt.id
}
