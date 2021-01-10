# Deploy Cloud Function

## Pre-requisites
* GCP Project
* Service Account with the following IAM roles:
    * Storage Admin
    * Cloud Functions Admin
    * Cloud Scheduler Admin
    * Cloud SQL Admin
    * Service Account User
* Service Account Credentials/Key

Note: It is advised to use the same service account for both Cloud Function and Cloud Scheduler.


## Deployment

To run `main.tf`, firstly either update the `variables.tf` or specify the input variables via the command-line or a var-file. 

Here's an example `var-file` (say, `terraform.tfvars`):

```
region = "<gcp region>"
region_zone = "<gcp zone>"
project_id = "<project id>"
bucket_name = "<gcs bucket>"
cloud_function_name = "<cloud function name>"
service_account = "<service account email>"
credentials_file_path = "<path to service account credentials key file>"
```

Once you update the variables, you can deploy the cloud function by simply running:

`> terraform init`

and

`> terraform apply -var-file=terraform.tfvars`

The Cloud Function will now be available at:
`https://<gcp region>-<project id>.cloudfunctions.net/<cloud function name>`