variable "region" {
    default = "us-central1"
}

variable "region_zone" {
    default = "us-central1-a"
}

variable "project_id" {
    description = "GCP Project ID"
}

variable "credentials_file_path" {
    description = "Path to the JSON file containing the account credentials"
}

variable "service_account" {
    description = "service account to be associated with the function"
}

variable "bucket_name" {
    description = "gcs bucket to upload the cloud function"
}

