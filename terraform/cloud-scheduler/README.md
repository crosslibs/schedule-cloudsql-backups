# Deploy Cloud Scheduler Jobs

The terraform plan deploys `3` cloud scheduler jobs as follows:

* Create a new On-Demand backup for Cloud SQL database
* Fetch the status of the latest backup created (useful if alerting needs to be created)
* Discard older on-demand backups 

All the Cloud Scheduler Jobs will leverage the Cloud Function deployed. If you have not done that already, please follow the instructions in `terraform/cloud-function` to deploy the Cloud Function first. 

## Pre-requisites
* GCP Project
* Service Account with the following IAM roles:
    * Storage Admin
    * Cloud Functions Admin
    * Cloud Scheduler Admin
    * Cloud SQL Admin
    * Service Account User
* Service Account Credentials/Key
* Cloud Function that provides 3 triggers for Cloud SQL Backup Management

Note: It is advised to use the same service account for both Cloud Function and Cloud Scheduler. 

## Deployment

To run `main.tf`, firstly either update the `variables.tf` or specify the input variables via the command-line or a var-file. 

Here's an example `var-file` (say, `terraform.tfvars`):

```
region = "<gcp region>"
region_zone = "<gcp zone>"
project_id = "<gcp project id>"
service_account = "<service account email>"
credentials_file_path = "<path to the service account credentials file>"
cloud_function_name = "<cloud function name>"
instance_id = "<cloud sql instance id>"
backup_schedule = "<on-demand backup creation schedule (e.g. 0 */2 * * *)>"
backup_status_schedule = "<check the status of the latest backup (e.g. 2 */2 * * *)>"
discard_backups_schedule = "<schedule for discarding older backups (e.g. 5 */12 * * *)>"
retain_count = <no. of backups to keep (e.g. 10)>
retain_days = <how long (in days) to keep the backups (e.g. 7)>
schedule_time_zone = "<time zone for the scheduler zone (e.g. Asia/Kolkata)>"
```

Once you update the variables, you can deploy the cloud scheduler jobs by simply running:

`> terraform init`

and

`> terraform apply -var-file=terraform.tfvars`

There will be `3` cloud scheduler jobs created as follows:
* `<instance id>-backup`
* `<instance id>-backup-status`
* `<instance id>-discard-backups`