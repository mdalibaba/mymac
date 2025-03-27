import { LightningElement, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

import getWorkers from '@salesforce/apex/CustomWorkerDetail.getWorkers';

export default class CustomWorkerDetail extends LightningElement {
    @track workers = [];
    @track selectedWorkerId;



    error;
  records;

    @wire(getWorkers, { userId: USER_ID })
    wiredWorkers({ error, data }) {
        if (data) {
            this.workers = data;
            if (data.length > 0) {
                this.selectedWorkerId = data[0].Id; // Auto-select first worker
            }
        } else if (error) {
            console.error('Error fetching workers:', error);
        }
    }

    
  @wire(getRelatedListRecords, {
    parentRecordId: '$selectedWorkerId'  ,
    relatedListId: 'HRMSUS__Project_Assignments__r',
    fields: ['HRMSUS__Project_Assignment__c.Id', 'HRMSUS__Project_Assignment__c.Name'],
    
  })
  listInfo({ error, data }) {
    if (data) {
      this.records = data.records;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.records = undefined;
    }
  }


    

    handleWorkerSelect(event) {
        this.selectedWorkerId = event.target.dataset.id;
    }
}
