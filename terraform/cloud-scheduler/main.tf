provider "google" {
    credentials = file(var.credentials_file_path)
    project     = var.project_id
    region      = var.region
    zone        = var.region_zone
}

locals {
    cloud_function_url = "https://${var.region}-${var.project_id}.cloudfunctions.net/${var.cloud_function_name}"
}

resource "google_cloud_scheduler_job" "backup" {
    name        = "${var.instance_id}-backup"
    description = "create an on-demand cloudsql backup at a fixed interval"
    schedule    = var.backup_schedule
    time_zone   = var.schedule_time_zone

    http_target {
      http_method = "POST"
      uri         = "${local.cloud_function_url}/projects/${var.project_id}/instances/${var.instance_id}/backups"
      oidc_token {
        service_account_email = var.service_account
        audience              = local.cloud_function_url
      }
    }
}

resource "google_cloud_scheduler_job" "status" {
    name        = "${var.instance_id}-backup-status"
    description = "log status of the latest backup at a fixed schedule"
    schedule    = var.backup_status_schedule
    time_zone   = var.schedule_time_zone

    http_target {
      http_method = "GET"
      uri         = "${local.cloud_function_url}/projects/${var.project_id}/instances/${var.instance_id}/backups/latest"
      oidc_token {
        service_account_email = var.service_account
        audience              = local.cloud_function_url
      }
    }
}

resource "google_cloud_scheduler_job" "discard_old_backups" {
    name        = "${var.instance_id}-discard-backups"
    description = "discards old backups at a fixed schedule"
    schedule    = var.discard_backups_schedule
    time_zone   = var.schedule_time_zone

    http_target {
      http_method = "DELETE"
      uri         = "${local.cloud_function_url}/projects/${var.project_id}/instances/${var.instance_id}/backups?retain_count=${var.retain_count}&retain_days=${var.retain_days}"
      oidc_token {
        service_account_email = var.service_account
        audience              = local.cloud_function_url
      }
    }
}

