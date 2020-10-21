provider "azurerm" {
  version = "=2.5.0"
  features {}
}


variable "imageversion" {
  description = "Tag of the image to deploy"
}

variable "dockerhub-username" {
  description = "DockerHub username"
}


terraform {
  backend "azurerm" {
    
  }
}

resource "azurerm_resource_group" "rg" {
  name     = "Good"
  location = "eastus"
}


resource "azurerm_container_group" "aci" {
  name                = "aci-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  ip_address_type     = "public"
  dns_name_label      = "myapp-demo"
  os_type             = "linux"
  container {
    name   = "myappdemo"
    image  = "docker.io/${var.dockerhub-username}/repo_name:${var.imageversion}"
    cpu    = "0.5"
    memory = "1.5"

    ports {
      port     = 8080
      protocol = "TCP"
    }

  }
}
