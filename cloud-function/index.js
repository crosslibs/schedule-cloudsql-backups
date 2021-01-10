/**
 * Copyright 2020, Chaitanya Prakash N <chaitanyaprakash.n@gmail.com>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const express = require('express');
const {google} = require('googleapis'); 
const sqladmin = google.sqladmin('v1beta4');
const {v4: uuidv4} = require('uuid');


/**
 * helper class to handle http(s) responses
 */
class Response {

    /**
     * create a new object
     * @param res https://expressjs.com/en/api.html#res
     */
    constructor(res){
        this.res = res;
        this.id = uuidv4();
    }

    /**
     * log messages to stdout
     * @param message str 
     */
    log = (message) => {
        console.log(`${this.id}: ${message}`);
    }

    /**
     * log messages to stderr
     * @param message str 
     */
    error = (message) => {
        console.error(`${this.id}: ${message}`);
    }


    /**
     * sends error response to the client
     * @param code int (a valid http status code) 
     * @param message str 
     */
    sendError = (code, message) => {
        this.error(`sending error to client with code: ${code}`);
        this.error(`sending error to client with message: ${message}`);
        this.res.status(code).json({
            error: {
                code: code,
                message: message
            }
        });
    }

    /**
     * sends successful response to the client
     * @param code int (a valid http status code)
     * @param message str 
     * @param body obj 
     */
    send = (code, message, body) => {
        let responseBody = body || null;
        this.log(`sending response to client with code: ${code}`);
        this.log(`sending response to client with message: ${message}`);
        this.log(`sending response to client with body: ${JSON.stringify(responseBody)}`);
        this.res.status(code).json({
            status: code,
            message: message,
            result: responseBody
        });
    }
}

/**
 * deletes old backups based on specified params - retention count and retention days
 * @param response Response object 
 * @param projectId gcp project id 
 * @param instanceId cloud sql instance id 
 * @param retentionCount no. of on-demand backups to retain (i.e. retentionCount number of latest backups will be retained)
 * @param retentionDays no. of days to keep the on-demand backups (i.e. backups older than retentionDays will be purged) 
 */
const deleteBackups = async (response, projectId, instanceId, retentionCount, retentionDays) => {
    const auth = new google.auth.GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/sqlservice.admin'
        ]
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    response.log(`fetching all backups for project: ${projectId} and instance: ${instanceId}`);

    // fetch upto 500 backups associated with the Cloud SQL
    // assumption: There will not be more than 500 backups
    // TODO: Implement pagination instead of hardcoding 500.
    const res = await sqladmin.backupRuns.list({
        project: projectId,
        instance: instanceId,
        maxResults: 500
    });

    let resp = {
        retention: {
            days: retentionDays,
            count: retentionCount
        },
        deleted: {
            total: 0,
            backups: []
        }
    };

    if(res.data.items === undefined) {
        return resp;
    }

    let allBackups = res.data.items.filter( item => {
        return item.type === "ON_DEMAND"
    });

    // if retention count is less than zero or not specified, retention count logic is not applied
    let toDeleteByCount = [];
    if (retentionCount >= 0
        && allBackups.length > retentionCount){
        for (let i = retentionCount; i < allBackups.length; i++) {
            toDeleteByCount.push(allBackups[i].id);
        }
    }

    // if retention days is less than zero or not specified, then retention days logic is not applied
    let toDeleteByDays = [];
    if (retentionDays >= 0) {
        let oldestDate = new Date();
        oldestDate.setDate(oldestDate.getDate() - retentionDays);
        toDeleteByDays = allBackups.filter(backup => {
            return new Date(backup.endTime) < new Date(oldestDate);
        }).map(backup => { return backup.id; });
    }

    // list of backups to be deleted
    let toBeDeleted = [...new Set([...toDeleteByCount, ...toDeleteByDays])];
    toBeDeleted.forEach(async (id) => {
        response.log(`deleting backup with id: ${id}`);
        const res = await sqladmin.backupRuns.delete({
            project: projectId,
            instance: instanceId,
            id: id
        });
        if (res.status !== 200) {
            response.error(`error occurred while deleting backup with id: ${id}`);
        }
        else {
            response.log(`deleting backup with id: ${id} successful`);
        }
    });

    // total number of backups deleted
    resp['deleted']['total'] = toBeDeleted.length;
    // list of purged backups
    resp['deleted']['backups'] = toBeDeleted;

    return resp;
}

/**
 * retrieve the status of the backup (id) specified
 * if backup id is specified as latest, the backup id of the latest backup is determined and 
 * its status is returned
 * @param response Response object 
 * @param projectId gcp project id 
 * @param instanceId cloud sql instance id 
 * @param backupId cloud sql backup id
 */
const getBackupStatus = async (response, projectId, instanceId, backupId) => {

    const auth = new google.auth.GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/sqlservice.admin'
        ]
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    // if status of the latest run is specified, fetch the most recent run id
    let backupRunId = backupId;
    if(backupId.toLowerCase() === 'latest'){
        response.log(`fetching the backup id of the latest backup for project: ${projectId} and instance: ${instanceId}`);
        const res = await sqladmin.backupRuns.list({
            maxResults: 1,
            project: projectId,
            instance: instanceId
        });

        if(res.data.items === undefined) {
            return {
                status: 'no backups exist'
            };
        }
        // latest backup id
        backupRunId = res.data.items[0].id;
    }

    response.log(`fetching status for project: ${projectId} and instance: ${instanceId} and backup id: ${backupRunId}`);

    // return the status of the backup run with the id
    return await sqladmin.backupRuns.get({
        id: backupRunId,
        project: projectId,
        instance: instanceId
    });

}

/**
 * create a new on-demand backup for the specified database
 * @param response Response object 
 * @param projectId string
 * @param instanceId string 
 */
const startNewOnDemandBackup = async (response, projectId, instanceId) => {

    const auth = new google.auth.GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/sqlservice.admin'
        ]
    });
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    response.log(`starting a new on-demand backup for project: ${projectId} and instance: ${instanceId}`);

    // create an on demand backup
    return await sqladmin.backupRuns.insert({
        project: projectId,
        instance: instanceId
    });
}

const app = express();

// GET method - retrieves the status of the backup id specified. 
// in addition,'latest' is also accepted as a valid parameter for :backupId
app.get('/projects/:projectId/instances/:instanceId/backups/:backupId', 
    (req, res) => {
        let response = new Response(res);
        getBackupStatus(response, 
            req.params.projectId,
            req.params.instanceId,
            req.params.backupId)
        .then(resp => {
            response.log(`on-demand backup details found for id: ${req.params.backupId}`);
            response.send(resp.status, 'success', resp.data);
        })
        .catch(err =>  {
            if(`${err}`.includes('no backups exist')){
                response.log(`no on-demand backups exist`);
                response.send(404, 'no on-demand backups exist');
            }
            else {
                response.error(`error occurred while fetching backup run (${req.params.backupId}): ${err}`);
                response.sendError(err.response.data.error.code, err.response.data.error.message);
            }
        });
    });

// POST method - create a new on-demand backup    
app.post('/projects/:projectId/instances/:instanceId/backups', 
    (req, res) => {
        let response = new Response(res);
        startNewOnDemandBackup(response, 
                req.params.projectId, 
                req.params.instanceId)
            .then(resp => {
                response.log('new on-demand backup scheduled successfully');
                response.send(resp.status, 'backup started successfully', resp.data);
            })
            .catch(err => {
                response.error(`error occurred while starting an on-demand backup: ${err}`);
                response.sendError(err.response.data.error.code, err.response.data.error.message);
            });
    });

// DELETE method - discards old backups based on two query parameters: retain_count and retain_days
// retain_count specifies the number of latest backups to retain
// retain_days specifies the number of days to retain the backups
// Not specifying either of the query params or setting negative values would mean they are not utilized
// for determining the backups to be purged.
app.delete('/projects/:projectId/instances/:instanceId/backups', 
    (req, res) => {
        let response = new Response(res);

        if(req.query.retain_count === undefined 
            && req.query.retain_days === undefined){
            response.send(200, 'nothing to be deleted. use query parameters retain_count and/or retain_days to specify retention criteria');
            return;
        }

        if((req.query.retain_days !== undefined 
            && parseInt(req.query.retain_days) < 0)
            || (req.query.retain_count !== undefined
                && parseInt(req.query.retain_count) < 0)) {
                response.sendError(400, `error: retain_count and retain_days must be non-negative integers`);
                return;
        }

        let days = req.query.retain_days ? parseInt(req.query.retain_days) : -1;
        let count = req.query.retain_count ? parseInt(req.query.retain_count) : -1;

        deleteBackups(response,
                req.params.projectId,
                req.params.instanceId,
                count,
                days)
            .then(data => {
                response.log('deleted on-demand backups successfully');
                response.send(200, 'on-demand backups deleted successfully', data);
            })
            .catch(err => {
                response.error(`error occurred while deleting on-demand backups: ${err}`);
                response.sendError(err.response.data.error.code, err.response.data.error.message);
            });
    });

// catch all method, for all other routes
app.all('*',
    (req, res) => {
        let response = new Response(res);
        if(req.method !== 'GET' 
            && req.method !== 'POST' 
            && req.method !== 'DELETE') {
                response.sendError(405, 
                    `received ${req.method} method in HTTP request. Only POST, GET and DELETE are allowed.`
                 );
        }
        else {
            response.sendError(404, 
                `resource not found: ${req.path}`
             );
        }
    });

// export app -- to be used by the cloud function
module.exports = { app };

