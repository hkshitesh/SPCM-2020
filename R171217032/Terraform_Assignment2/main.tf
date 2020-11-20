provider "aws"{
    region="us-east-1"
    access_key="*************************************"
    secret_key="***********************************************"
}

resource "aws_instance" "LoveSharmaDev1Instance" {
	ami = "ami-00ddb0e5626798373"
	count = 2
	key_name = "lovedev1"
	instance_type = "t2.micro"
	security_groups = ["lovesharmadev1"]
	tags = {
		Name = "LoveSharmaDev1Instance"
	}
}

resource "aws_s3_bucket" "tf_course" {
	bucket = "lovesharmadev2"
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

resource "aws_security_group" "lovesharmadev1" {
	name = "lovesharmadev1"
	description = "This is the security groups"

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
		Name = "lovesharmadev1"
	}

}
