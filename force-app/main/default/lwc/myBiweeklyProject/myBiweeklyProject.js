import { LightningElement,api,wire,track  } from 'lwc';
import GetPayperiod from '@salesforce/apex/ProjectWeeklySummaryApex.GetTotalPayperiods';
import getTimecards from '@salesforce/apex/ProjectWeeklySummaryApex.getListOfDailyTimecards';

export default class MyBiweeklyProject extends LightningElement {

    @api recordId;
    error;
    ppid;
    ppids=[{label:'None',value:''}];
    @track payPeriods = [];
    @track timecards = [];
    startDate = new Date(); // Replace with your start date
    endDate = new Date(); 
    @track dateList = [];
    
    // Get PayPeriods    
    @wire(GetPayperiod)
        wiredPayPeriods({ error, data }) {
            if (data) {
                this.payPeriods = data;
                // iterate  payPeriods and create options name label
                this.payPeriods.forEach(payPeriod => {
                    this.ppids.push({label:payPeriod.Name,value:payPeriod.Id});
                });
                console.log('ppids--'+this.ppids);
                this.error = undefined;
            } else if (error) {
                this.error = error;
                this.payPeriods = [];
            }
        }

        // handlepayperiodChange to get the pay period record and assign start date and end date
        handlepayperiodChange(event){
            let projectId=event.target.value;
            if(projectId=='' || projectId==undefined){
                return
            }
            //get payperiod from array
            this.ppid=projectId;
            let payPeriod = this.payPeriods.find(payPeriod => payPeriod.Id === projectId);
            this.startDate = new Date(payPeriod.BZP__PeriodBeginning__c);
            this.endDate = new Date(payPeriod.BZP__PeriodEnding__c);
            this.generateDateList(this.startDate, this.endDate);
        }
        generateDateList(startDate, endDate) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            let dateArray = [];
    
            // Loop through the dates from startDate to endDate
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                let dayName = dayNames[currentDate.getDay()];
                let date = currentDate.getDate();
                let month = currentDate.getMonth() + 1; // getMonth() is zero-based
    
                // Push the formatted string into the array
                dateArray.push(`${dayName} ${month}/${date}`);
    
                // Increment the current date by one day
                currentDate.setDate(currentDate.getDate() + 1);
            }
    
            // Update the dateList property
            this.dateList = dateArray;
        }

}