import { LightningElement,api,wire,track } from 'lwc';
import GetPayperiod from '@salesforce/apex/ProjectWeeklySummaryApex.getPayPeriods';
import getTimecards from '@salesforce/apex/ProjectWeeklySummaryApex.getListOfDailyTimecards';
import getProjAssgnments from '@salesforce/apex/ProjectWeeklySummaryApex.getlistofProjectAssignments';
import saveSummaryReportm from '@salesforce/apex/ProjectWeeklySummaryApex.SaveSummaryReport';
import getWeekDaysWithLabels from '@salesforce/apex/ProjectWeeklySummaryApex.getWeekDaysWithLabels';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningModal from 'lightning/modal';
import { CurrentPageReference } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
import { NavigationMixin } from 'lightning/navigation';
import Name from '@salesforce/schema/Account.Name';


let i=0;
export default class ExecutiveSummary extends NavigationMixin(LightningElement) {
		@track Payperiodlist = [];
		@track finalPrjAss = [];
		@track listofProjectAssignments = [];
		@track timecardlist = [];
		@track ppdlist = [];
		@track chosenValue = '';
		@track selectedppd = '';
		@track mondayD = '';
		@track sundayD = '';
		@track tuesdayD = '';
		@track wednesdayD = '';
		@track thrusdayD = '';
		@track fridayD = '';
		@track saturdayD = '';
		@track weekstartD = '';
		@track weekend = '';
		@track finalDTArray = [];
		@api recordId;
		payperiodId;
		dayslist=[];

		@wire(CurrentPageReference)
		currentPageReference;
		/*	connectedCallback() {  
				//add 2 seconds delay to open the page in a new tab
				setTimeout(() => {
						const url = `/lightning/n/HRMSUS__Projects__c?c__recordId=${this.recordId}`;
						window.open(url, '_blank');
						this.dispatchEvent(new CloseActionScreenEvent());
				}, 2000);

		}*/
		connectedCallback() {     

				setTimeout(() => {

						if(this.recordId ==undefined){
								this.recordId=this.currentPageReference.state.c__recordId;

						}
						console.log(`c__myParam = ${this.currentPageReference.state.c__recordId}`); 

				}, 2000);






		}
		@wire(GetPayperiod,{ recdId: '$recordId' })
		wiredUserRoles({ error, data }) {
				if (data) {
						//create array with elements which has been retrieved controller
						//here value will be Id and label of combobox will be Name
						       
						this.error = undefined;
						//this.ppdlist = data;
						this.Payperiodlist = data.map((item) => ({
                label: item.label,
                value: item.value
            }));
				} else if (error) {
						this.error = error;
						this.contacts = undefined;
				}
		}
		//gettter to return items which is mapped with options attribute
		get Payperiodlist() {
				return this.Payperiodlist;
		}


		get ppdlist() {
				return this.items;
		}

		handleChange(event) {
				// Get the string of the "value" attribute on the selected option
				const selectedOption = event.detail.value;
				console.log('selected value=' + selectedOption);
				this.chosenValue = selectedOption;
				console.log('ppdlist' + this.ppdlist);
				let j=0;
				
				getWeekDaysWithLabels({ ppid:this.chosenValue})
								.then(data=>{
								this.dayslist = data;
								}).catch(error => {
						console.error('Error fetching timecards:', error);
						 
				});
				 
		}



		//this value will be shown as selected value of combobox item
		get selectedValue(){
				return this.chosenValue;
		}

		get timecardlist() {
				return this.items;
		}
		handleOkay() {
				//this.dispatchEvent(new CloseActionScreenEvent());
				this[NavigationMixin.Navigate]({
						type: 'standard__recordPage',
						attributes: {
								recordId: this.recordId,
								actionName: 'view'
						}
				});

		}

		handleNext(){
				this.selectedppd = this.selectedValue;

				console.log('this.weekstartD --'+this.weekstartD );
				console.log('this.weekend --'+this.weekend );
				getProjAssgnments({ projectId: this.recordId,ppid:this.selectedppd })
						.then(result => {
						this.listofProjectAssignments = result;
						console.log('listofProjectAssignments' + this.listofProjectAssignments);
						//this.noTimecardsFound = this.timecards.length === 0; // Check if any timecards were returned
						return result;

				})

						.then(result => {
						getTimecards({ projectId: this.recordId,ppid:this.selectedppd})
								.then(data=>{
								this.timecardlist = data;
								console.log('timecardlist' + this.timecardlist);


								let listlength=this.listofProjectAssignments.length;
								let listtime=this.timecardlist.length;
								let mydata=[];
								for(let j=0; j<this.listofProjectAssignments.length; j++)  {
									let ST_Total=0;
									let OT_Total=0;
										let mydays=[];
										let perdiem=false;
										if(this.listofProjectAssignments[j].rightpm__Per_Diem_Frequency__c=='Weekly (7 days)'){
											perdiem=true;
										}
										
										for(let m=0; m<this.timecardlist.length; m++){


												if(this.timecardlist[m].HRMSUS__Employee__c == this.listofProjectAssignments[j].HRMSUS__Worker__c ){
													
														if(this.timecardlist[m].HRMSUS__Day__c == 'Sun'){
															
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															 
															 
															mydays.push({
 																		Sun:[{ Name:'Sun',
																					Id:this.timecardlist[m].Id,
																					rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																					parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Sun',
																					//rightpm__Per_Diem__c:this.timecardlist[m].rightpm__Per_Diem__c
																					rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																					HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																				 }]

																});
														}else if(this.timecardlist[m].HRMSUS__Day__c == 'Mon'){
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															mydays.push({

																		Mon:[{
																				Name:'Mon',
																				Id:this.timecardlist[m].Id,
																				rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																				parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Mon',
																				rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																				HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																				rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																		}]

																});


														}else if(this.timecardlist[m].HRMSUS__Day__c == 'Tue'){
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															mydays.push({

																		Tue:[{
																				Name:'Tue',	
																				Id:this.timecardlist[m].Id,
																				rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																				parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Tue',
																				rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																				HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																				rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																		}]

																});

														}else if(this.timecardlist[m].HRMSUS__Day__c == 'Wed'){
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															mydays.push({

																		Wed:[{
																				Name:'Wed',
																				Id:this.timecardlist[m].Id,
																				rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																				parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Wed',
																				rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																				HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																				rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																		}]

																});

														}else if(this.timecardlist[m].HRMSUS__Day__c == 'Thu'){
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															mydays.push({

																		Thu:[{
																				Name:'Thu',
																				Id:this.timecardlist[m].Id,
																				rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																				parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Thu',
																				rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																				HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																				rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																		}]

																});

														}else if(this.timecardlist[m].HRMSUS__Day__c == 'Fri'){
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															mydays.push({

																		Fri:[{
																				Name:'Fri',
																				Id:this.timecardlist[m].Id,
																				rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																				parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Fri',
																				rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																				HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																				rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																		}]

																});

														}else if(this.timecardlist[m].HRMSUS__Day__c == 'Sat'){
															let stvar=this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c;
															let otvar=this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c;
															ST_Total=ST_Total+stvar;
															OT_Total=OT_Total+otvar;
															mydays.push({

																		Sat:[{
																				Name:'Sat',
																				Id:this.timecardlist[m].Id,
																				rightpm__StraightTime__c:this.timecardlist[m].rightpm__StraightTime__c==undefined ? 0 :this.timecardlist[m].rightpm__StraightTime__c,
																					rightpm__OverTime__c:this.timecardlist[m].rightpm__OverTime__c==undefined ? 0 :this.timecardlist[m].rightpm__OverTime__c,
																				parentId:this.listofProjectAssignments[j].Id+','+this.timecardlist[m].Id+','+this.listofProjectAssignments[j].HRMSUS__Worker__c+','+'Sat',
																				rightpm__Per_Diem__c:perdiem ? true : this.timecardlist[m].rightpm__Per_Diem__c,
																				HRMSUS__Pay_Rate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																				rightpm__ST_Payrate__c:this.listofProjectAssignments[j].rightpm__PayRate__c,
																					rightpm__OT_Payrate__c:this.listofProjectAssignments[j].rightpm__OTPayRate__c,
																					rightpm__Per_Diem_rate__c:this.listofProjectAssignments[j].rightpm__Per_Diem__c,
																					rightpm__Apprentice_Type__c:this.listofProjectAssignments[j].rightpm__Apprentice_Program__c,
																					rightpm__Project__c:this.listofProjectAssignments[j].HRMSUS__Projects__c,
																					HRMSUS__Location__c:this.listofProjectAssignments[j].HRMSUS__Projects__r.HRMSUS__Location__c
																		}]

																});

														} 
														console.log('timecardlist' + this.timecardlist[m].HRMSUS__Day__c);
												}

										}
										//
                                         if(ST_Total>40){
                                            OT_Total=parseFloat(ST_Total-40).toFixed(2);
                                             
                                            ST_Total=40;
                                         }else{
                                            OT_Total=0;
                                         }
										mydata.push({
												wrkId:this.listofProjectAssignments[j].HRMSUS__Worker__c ,
												Per_Diem_Frequency:this.listofProjectAssignments[j].rightpm__Per_Diem_Frequency__c,
												Name:this.listofProjectAssignments[j].HRMSUS__Worker__r.Name,
												Timedata:mydays,
												STTotal:ST_Total,
												OTTotal:OT_Total,
												Total:ST_Total+OT_Total,
											
										});

								}
								console.log('mydata--'+mydata);
								this.finalPrjAss=mydata;

						})


						//this.noTimecardsFound = this.timecards.length === 0; // Check if any timecards were returned



				})
						.catch(error => {
						console.error('Error fetching timecards:', error);
						//	this.timecardlist = [];
						//  this.noTimecardsFound = true; // Handle errors and display appropriate message
				});








		}
		get listofProjectAssignments() {
				return this.items;
		}
		get timecardlist() {
				return this.items;
		}


		workerdataPreparation(){
				console.log('timecardlist in' );

		}

		handleDayChange(event){
				let eparentId= event.target.dataset.id;
				let  ename=event.target.name;
				let evalue=event.target.value;
				if(evalue==undefined || evalue==null || evalue=='' ){
					evalue=0;
					 
				}

				if (evalue !=0 && evalue.includes('.') && evalue.split('.')[1].length > 2  ) {
					evalue = Math.floor(evalue * 100) / 100;
						evalue=parseFloat(evalue).toFixed(2);
						event.target.value=evalue;
						 
				}
				 

				if(evalue>24){
					const evt = new ShowToastEvent({
						title: 'Warning!',
						message: 'hours should not be greater than 24 !',
						variant: 'warning',
						mode: 'dismissable' // Optional: mode can be 'dismissable', 'pester', or 'sticky'
				});
				this.dispatchEvent(evt); 
				event.target.value=0;
				evalue=0;
				 
				}else if(evalue<0){
					event.target.value=0;
				evalue=0;
				}

				// separete eparentId="abcd,efgj"
				// 
				let ids=eparentId.split(',');
				console.log('ids' + ids);
				let passignId=ids[0];
				let timesheetid=ids[1];
				let wrkrId=ids[2];
				let day=ids[3];
				this.finalPrjAss.forEach(element => {
					let ST_Total=0;
							let OT_Total=0;
							ST_Total=element.STTotal;
							OT_Total=element.OTTotal;
						if(element.wrkId==wrkrId){
							let perdiem=false;
							let perstatus=element.Per_Diem_Frequency;//'Per Workday' // 'Weekly (7 days)'
							if(element.Per_Diem_Frequency=='Per Workday'){
								perdiem=true;
								 
							}
							
							ST_Total=element.STTotal;
							OT_Total=element.OTTotal;
								element.Timedata.forEach(ele => {
										// object.hasOwnProperty(propertyName)

										if(ele.hasOwnProperty(day)){
												if(day=='Sun'){
														 
														if(ename=='Straight Time'){

																ele.Sun.forEach(el1=>{
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined) && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}

												}
										}
										//monday
										if(ele.hasOwnProperty(day)){
												if(day=='Mon'){
														 
														if(ename=='Straight Time'){

																ele.Mon.forEach(el1=>{
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined)  && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}
												}
										}
										//tuesday
										if(ele.hasOwnProperty(day)){
												if(day=='Tue'){
														 
														if(ename=='Straight Time'){

																ele.Tue.forEach(el1=>{
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined)  && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}
												}
										}
										//Wednesday
										if(ele.hasOwnProperty(day)){
												if(day=='Wed'){
														 
														if(ename=='Straight Time'){

																ele.Wed.forEach(el1=>{
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined) && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}
												}
										}
										//Thursday
										if(ele.hasOwnProperty(day)){
												if(day=='Thu'){
														 
														if(ename=='Straight Time'){

																ele.Thu.forEach(el1=>{
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined) && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}
												}
										}
										//Friday
										if(ele.hasOwnProperty(day)){
												if(day=='Fri'){
														 
														if(ename=='Straight Time'){

																ele.Fri.forEach(el1=>{
																	
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined)  && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}
												}
										}
										//Saturday
										if(ele.hasOwnProperty(day)){
												if(day=='Sat'){
														 
														if(ename=='Straight Time'){

																ele.Sat.forEach(el1=>{
																	let myel1=el1.rightpm__StraightTime__c;
																	ST_Total=ST_Total-myel1;
																	ST_Total=ST_Total+Number(evalue);
																	let rounded = Math.round(ST_Total * 100) / 100;
																	ST_Total=rounded;
																		el1.rightpm__StraightTime__c=evalue;
																		if(evalue>0){
																			el1.rightpm__Per_Diem__c=perdiem ? true : el1.rightpm__Per_Diem__c;
																		}else if(evalue==0 && (el1.rightpm__OverTime__c==''|| el1.rightpm__OverTime__c==undefined) && perstatus=='Per Workday'){
																			el1.rightpm__Per_Diem__c=false;
																		}else if(evalue==0 && perstatus=='Weekly (7 days)'){
																			el1.rightpm__Per_Diem__c=true;
																		}else if(evalue==0 && perstatus==undefined){
																			el1.rightpm__Per_Diem__c=false;
																		}
																});
														}
												}
										}

								});
						}
                          
                         
                        
						element.STTotal=ST_Total;
						element.OTTotal=OT_Total;
				}



			
			
			);
				console.log('eparentId' + eparentId);
				console.log('ename' + ename);
				console.log('evalue' + evalue);
				console.log('this.finalPrjAss '+this.finalPrjAss);

                this.finalPrjAss.forEach(element => {
                    let mytotal=0;
					 let sun=0;
                     let mon=0;let tue=0;let wed=0;let thu=0;let fri=0;let sat=0;
						if(element.wrkId==wrkrId){
                            element.Timedata.forEach(ele => {
                                if(ele.hasOwnProperty('Sun')){
                                    ele.Sun.forEach(el1=>{
                                        sun=el1.rightpm__StraightTime__c;
                                    });
                                }
                                if(ele.hasOwnProperty('Mon')){
                            ele.Mon.forEach(el1=>{
                                mon=el1.rightpm__StraightTime__c;
                            });
                        
                        }
                        if(ele.hasOwnProperty('Tue')){
                            ele.Tue.forEach(el1=>{
                                tue=el1.rightpm__StraightTime__c;
                            });
                        }
                        if(ele.hasOwnProperty('Wed')){
                            ele.Wed.forEach(el1=>{
                                wed=el1.rightpm__StraightTime__c;
                            });
                        }
                        if(ele.hasOwnProperty('Thu')){
                            ele.Thu.forEach(el1=>{
                                thu=el1.rightpm__StraightTime__c;
                            });
                        }
                       if( ele.hasOwnProperty('Fri')){
                            ele.Fri.forEach(el1=>{
                                fri=el1.rightpm__StraightTime__c;
                                
                            });
                        }
                        if(ele.hasOwnProperty('Sat')){
                            ele.Sat.forEach(el1=>{
                                sat=el1.rightpm__StraightTime__c;
                            });
                        }
                             mytotal=parseFloat(sun)+parseFloat(mon)+parseFloat(tue)+parseFloat(wed)+parseFloat(thu)+parseFloat(fri)+parseFloat(sat);
                             
                            
                        });

                        element.Total=mytotal;
                        let rounded1 = Math.round(mytotal * 100) / 100;
                            if(rounded1>40){
                                element.OTTotal=parseFloat(rounded1-40).toFixed(2);
                                element.STTotal=40;
                            }else{
                                element.STTotal=rounded1;
                                element.OTTotal=0;
                            }
							 
                            return;
                        }
                    });


		}
		
		 
		handleCreate(){
				this.finalDTArray = [];
				console.log('finalDTArray' + this.finalDTArray);	
				this.finalPrjAss.forEach(element => {
						element.Timedata.forEach(ele => {
								// object.hasOwnProperty(propertyName) 
								if(ele.hasOwnProperty('Sun')){
										ele.Sun.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
								if(ele.hasOwnProperty('Mon')){
										ele.Mon.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
								if(ele.hasOwnProperty('Tue')){
										ele.Tue.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
								if(ele.hasOwnProperty('Wed')){
										ele.Wed.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
								if(ele.hasOwnProperty('Thu')){
										ele.Thu.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
								if(ele.hasOwnProperty('Fri')){
										ele.Fri.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
								if(ele.hasOwnProperty('Sat')){
										ele.Sat.forEach(el1=>{																
												this.finalDTArray.push({
														Id:el1.Id,
														rightpm__StraightTime__c:el1.rightpm__StraightTime__c,
														rightpm__OverTime__c:el1.rightpm__OverTime__c,
														rightpm__Per_Diem__c:el1.rightpm__Per_Diem__c,
														HRMSUS__Pay_Rate__c:el1.rightpm__PayRate__c,
														rightpm__ST_Payrate__c:el1.rightpm__ST_Payrate__c,
																					rightpm__OT_Payrate__c:el1.rightpm__OT_Payrate__c,
																					rightpm__Per_Diem_rate__c:el1.rightpm__Per_Diem_rate__c,
																					rightpm__Apprentice_Type__c:el1.rightpm__Apprentice_Type__c,
																					rightpm__Project__c:el1.rightpm__Project__c,
																					HRMSUS__Location__c:el1.HRMSUS__Location__c
												});
										});
								}
						});
				});
				console.log('finalDTArray--1' + this.finalDTArray);	
				//	let usersJson = JSON.stringify(this.finalDTArray)
				saveSummaryReportm({ jsonstr: this.finalDTArray})
						.then(result => {
						console.log('result--1' + this.result);	
						const evt = new ShowToastEvent({
								title: 'Success',
								message: 'Records has been saved successfully!',
								variant: 'success',
								mode: 'dismissable' // Optional: mode can be 'dismissable', 'pester', or 'sticky'
						});
						this.dispatchEvent(evt); 
						window.location.reload();
				})
						.catch(error => {
						//this.showToast('Error', error.body.message, 'error');
						const evt = new ShowToastEvent({
								title: 'Error',
								message: 'Failed to save the record. '+error.body.message,
								variant: 'error',
								mode: 'dismissable' // Optional: mode can be 'dismissable', 'pester', or 'sticky'
						});
						this.dispatchEvent(evt); 
				});
		}
		handleCancel(){
				this[NavigationMixin.Navigate]({
						type: 'standard__recordPage',
						attributes: {
								recordId: this.recordId,
								actionName: 'view'
						}
				});

		}

		handleCheckChange(event){
			let eparentId= event.target.dataset.id;
			let  ename=event.target.name;
			let evalue=event.target.value;
			let echeck=event.target.checked;

			// separete eparentId="abcd,efgj"
			// 
			let ids=eparentId.split(',');
			console.log('ids' + ids);
			let passignId=ids[0];
			let timesheetid=ids[1];
			let wrkrId=ids[2];
			let day=ids[3];
			this.finalPrjAss.forEach(element => {
					if(element.wrkId==wrkrId){
							element.Timedata.forEach(ele => {
									// object.hasOwnProperty(propertyName)

									if(ele.hasOwnProperty(day)){
											if(day=='Sun'){
													if(ename=='Per Diem'){

															ele.Sun.forEach(el1=>{
																	el1.rightpm__Per_Diem__c=echeck;
															});
													}
													 

											}
									}
									//monday
									if(ele.hasOwnProperty(day)){
											if(day=='Mon'){
												if(ename=='Per Diem'){

													ele.Mon.forEach(el1=>{
															el1.rightpm__Per_Diem__c=echeck;
													});
											}
													 
											}
									}
									//tuesday
									if(ele.hasOwnProperty(day)){
											if(day=='Tue'){
												if(ename=='Per Diem'){

													ele.Tue.forEach(el1=>{
															el1.rightpm__Per_Diem__c=echeck;
													});
											}
											}
									}
									//Wednesday
									if(ele.hasOwnProperty(day)){
											if(day=='Wed'){
												if(ename=='Per Diem'){

													ele.Wed.forEach(el1=>{
															el1.rightpm__Per_Diem__c=echeck;
													});
											}
											}
									}
									//Thursday
									if(ele.hasOwnProperty(day)){
											if(day=='Thu'){
												if(ename=='Per Diem'){

													ele.Thu.forEach(el1=>{
															el1.rightpm__Per_Diem__c=echeck;
													});
											}
											}
									}
									//Friday
									if(ele.hasOwnProperty(day)){
											if(day=='Fri'){
												if(ename=='Per Diem'){

													ele.Fri.forEach(el1=>{
															el1.rightpm__Per_Diem__c=echeck;
													});
											}
											}
									}
									//Saturday
									if(ele.hasOwnProperty(day)){
											if(day=='Sat'){
												if(ename=='Per Diem'){

													ele.Sat.forEach(el1=>{
															el1.rightpm__Per_Diem__c=echeck;
													});
											}
											}
									}

							});
					}
			});
			console.log('eparentId' + eparentId);
			console.log('ename' + ename);
			console.log('evalue' + evalue);
			console.log('this.finalPrjAss '+this.finalPrjAss);
		}




}