provider "google" {
    credentials = file(var.credentials_file_path)
    project     = var.project_id
    region      = var.region
    zone        = var.region_zone
}

resource "google_storage_bucket" "bucket" {
    name    = var.bucket_name
    
    uniform_bucket_level_access = true
}

data "archive_file" "cloud_function" {
    type    = "zip"
    output_path = "/tmp/cloud_function.zip"
    source_dir  = "../../cloud-function"
}

resource "google_storage_bucket_object" "archive" {
    name    = "cloud_function.zip"
    bucket  = google_storage_bucket.bucket.name
    source  = "/tmp/cloud_function.zip"
}

resource "google_cloudfunctions_function" "function" {
    name        = "api"
    description = "api to manage on-demand backups"
    runtime     = "nodejs12"

    available_memory_mb = 128
    trigger_http        = true
    entry_point         = "app"
    timeout             = 60
    max_instances       = 1

    service_account_email = var.service_account
    source_archive_bucket = google_storage_bucket.bucket.name
    source_archive_object = google_storage_bucket_object.archive.name
}

