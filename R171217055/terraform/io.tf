### Variable  ###
variable "region" {
  default= "us-west-2"
}

variable "shared_credentials_file" {
  default = "/root/.aws/credentials"
}

#variable "profile" {
#  default = "terraform"
#}

variable "instance_type" {
  default = "t3.micro"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  default = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  default = "10.0.2.0/24"
}

variable "ami_lin" {
  default = "ami-6cd6f714"
}

variable "ami_dock" {
  default = "ami-00430184c7bb49914"
}

variable "key_path" {
  default = "/root/.ssh/id_rsa.pub"
}


### Output  ###
output "nginx_dns_name" {
  value = aws_instance.nginx.public_dns
}
output "Worker-node1_Private_IP" {
  value = aws_instance.server1.private_ip
}
output "Worker-node22_Private_IP" {
  value = aws_instance.server2.private_ip
}
