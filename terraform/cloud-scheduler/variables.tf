variable "region" {
    default = "us-central1"
}

variable "region_zone" {
    default = "us-central1-a"
}

variable "project_id" {
    description = "GCP Project ID"
}

variable "instance_id" {
    description = "Cloud SQL Instance ID"
}

variable "credentials_file_path" {
    description = "Path to the JSON file containing the account credentials"
}

variable "service_account" {
    description = "service account to be used to invoke the function"
}

variable "cloud_function_name" {
    description = "cloud function name"
}

variable "schedule_time_zone" {
    description = "timezone from tz database representing the time zone for the scheduler jobs"
}

variable "backup_schedule" {
    description = "on-demand backup schedule represented as a cron expression"
}

variable "backup_status_schedule" {
    description = "schedule (represented as cron expression) for checking status of the latest backup"
}

variable "discard_backups_schedule" {
    description = "cron expression representing schedule for discarding old backups"
}

variable "retain_count" {
    description = "number of on-demand backups to keep"
}

variable "retain_days" {
    description = "number of days to keep the backups"
}
