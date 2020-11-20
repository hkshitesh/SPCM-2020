provider "aws" {
	access_key = "*****************"
	secret_key = "********************"
	region = "us-east-1"
	}

resource "aws_instance" "KushSharmaInstance" {
	ami = "ami-04bf6dcdc9ab498ca"
	count = "2"
	key_name = "Kush"
	instance_type = "t2.micro"
	security_groups = ["KushSharma"]
	tags = {
		Name = "KushSharmaInstance"
	}
}

resource "aws_s3_bucket" "tf_course" {
	bucket = "Dastan-aka-Kush"
	acl = "private"
}
	
resource "aws_vpc" "vpc"{
    cidr_block = "10.0.0.0/16"
    tags = {
    	Name = "vpc"
    }
}

resource "aws_vpn_gateway" "vpn_gateway" {
	vpc_id = aws_vpc.vpc.id
}

resource "aws_customer_gateway" "customer_gateway" {
	bgp_asn = 65000
	ip_address = "172.0.0.1"
	type = "ipsec.1"
}

resource "aws_vpn_connection" "main" {
	vpn_gateway_id = aws_vpn_gateway.vpn_gateway.id
	customer_gateway_id = aws_customer_gateway.customer_gateway.id
	type = "ipsec.1"
	static_routes_only = true
}

resource "aws_security_group" "KushSharma" {
	name = "KushSharma"
	description = "This is the Security Groups"
	ingress {
		from_port = 22
		to_port = 22
		protocol = "tcp"
		cidr_blocks = ["0.0.0.0/0"]
	}
	egress {
		from_port = 0
		to_port = 65535
		protocol = "tcp"
		cidr_blocks = ["0.0.0.0/0"]
	}
	tags = {
		Name = "KushSharma"
	}
}






