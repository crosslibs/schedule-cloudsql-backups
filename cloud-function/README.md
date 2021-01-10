# Google Cloud Function for CloudSQL backup management
The Cloud Function provides methods for creating a new on-demand backup, retrieving the status of any backup or the latest backup and also discarding older backups. 

## How to Deploy this Cloud Function
Refer to `terraform/cloud-function` for instructions on how to deploy this cloud function


## Cloud Function Triggers

### Create a new On-Demand Cloud SQL Backup
Use the HTTP trigger with `POST` method. Notice the path parameters - `project-id` and `cloud-sql-instance-id` that need to be specified.
e.g. 
```
curl -X POST \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://<gcp-region>-<project-id>.cloudfunctions.net/cloud_function_name/projects/<project-id>/instances/<cloud-sql-instance-id>/backups
```

### Retrieve status of latest backup
Use the HTTP trigger with `GET` method. Notice the path parameters - `project-id` and `cloud-sql-instance-id` that need to be specified.
e.g. 
```
curl -X GET \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://<gcp-region>-<project-id>.cloudfunctions.net/cloud_function_name/projects/<project-id>/instances/<cloud-sql-instance-id>/backups/latest
```

### Retrieve status of a specific backup run
Use the HTTP trigger with `GET` method. Notice the path parameters - `project-id`,  `cloud-sql-instance-id` and `backup-run-id` that need to be specified.
e.g. 
```
curl -X GET \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://<gcp-region>-<project-id>.cloudfunctions.net/cloud_function_name/projects/<project-id>/instances/<cloud-sql-instance-id>/backups/<backup-run-id>
```

### Discard old on-demand backups
Use the HTTP trigger with `DELETED` method. Notice the path parameters - `project-id`,  `cloud-sql-instance-id` and query parameters - `retain_count` and `retain_days` that need to be specified.

`retain_count` specifies the number of on-demand backups to retain (e.g. 10 backups). Specifying a negative value or omitting this will keep all the backups.


`retain_days` specifies the number of days to keep any backup (e.g. 7 days. i.e. any backup older than 7 days must be removed). Specifying a negative value or omitting this will retain all the backups.

You can specify *one* or *both* of these query parameters.

e.g. 
```
curl -X DELETE \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://<gcp-region>-<project-id>.cloudfunctions.net/cloud_function_name/projects/<project-id>/instances/<cloud-sql-instance-id>/backups?retain_days=<num-days>&retain_count=<count-of-backups>
```