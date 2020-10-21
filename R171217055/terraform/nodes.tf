### Create Nodes ###
## Node1 (Docker node1)
resource "aws_instance" "server1" {
  ami = var.ami_dock
  instance_type = var.instance_type
  key_name = aws_key_pair.default.id
  subnet_id = aws_subnet.public-subnet.id
  security_groups = ["${aws_security_group.instancesg.id}"]
  associate_public_ip_address = true
  user_data = file("install.sh")

  tags = {
    Name = "worker-node1"
  }
}

## Node2 (Docker node2)
resource "aws_instance" "server2" {
  ami = var.ami_dock
  instance_type = var.instance_type
  key_name = aws_key_pair.default.id
  subnet_id = aws_subnet.public-subnet.id
  security_groups = ["${aws_security_group.instancesg.id}"]
  associate_public_ip_address = true
  user_data = file("install.sh")

  tags = {
    Name = "worker-node2"
  }
}

## ALB (Nginx LB)
resource "aws_instance" "nginx" {
  ami = var.ami_lin
  instance_type = var.instance_type
  key_name = aws_key_pair.default.id
  subnet_id = aws_subnet.public-subnet.id
  security_groups = ["${aws_security_group.lbsg.id}"]
  associate_public_ip_address = true
  provisioner "remote-exec" {
    connection {
                   host = self.public_ip
                   type = "ssh"
                   user = "ec2-user"
                   private_key = file("~/.ssh/id_rsa")
                   timeout = "1m"
                   agent = "false"
      }
    inline = [
      "sudo sed -i -e '$a\\' -e '${aws_instance.server1.private_ip} server1' /etc/hosts",
      "sudo sed -i -e '$a\\' -e '${aws_instance.server2.private_ip} server2' /etc/hosts"
    ]
  }

  user_data = file("install2.sh")
  tags = {
    Name = "nginx-node"
  }
}
