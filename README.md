# Schedule on-demand Cloud SQL Backups in GCP

Automate create, cleanup and management of Cloud SQL backups using Cloud Function and Cloud Scheduler jobs in GCP


## Solution

The solution leverages Cloud Function that provides three triggers - 
* to create a new on-demand backup
* to fetch the status of an on-demand backup or the latest backup and 
* discard older backups based on two criteria - backup retention days and retention count

and automates these by leveraging Cloud Scheduler jobs to trigger these at a fixed schedule.


## How to deploy the solution?

The solution involves two steps:
* Deploy the Cloud Function trigger
* Deploy 3 Cloud Scheduler Jobs for creating backups, retrieving latest backup status and discarding older backups

The deployment is automated using terraform. Please follow the instructions in `terraform/cloud-function` and `terraform/cloud-scheduler` folders to deploy the Cloud Function and the Cloud Scheduler Jobs.


<br/>

#### Any PRs to improve the solution are welcome!