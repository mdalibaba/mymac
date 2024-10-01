import { api, LightningElement, track ,wire} from 'lwc';
import searchApplications from '@salesforce/apex/CreatePlacementClass.searchApplications';
import loadApplications from '@salesforce/apex/CreatePlacementClass.loadApplications';
import createPlacements from '@salesforce/apex/CreatePlacementClass.createPlacements';
import getallCandidate from '@salesforce/apex/CreatePlacementClass.getallCandidate'; 
import createCandidate from '@salesforce/apex/CreatePlacementClass.createCandidate';
import getCountryPicklistValues from '@salesforce/apex/CreatePlacementClass.getCountryPicklistValues';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import { CloseActionScreenEvent } from 'lightning/actions';

export default class CreatePlacement extends  NavigationMixin(LightningElement)  {
   @api recordId;
    @track searchName = '';
    @track searchAddress = '';
    @track applications = [];
    candidates=[];
    candidateemails = new Set(); 
    @track selectedApplications = new Set(); // Set to store selected Application IDs
    @api headerText='CREATE PLACEMENT'; 

    @api isModalOpen = false; // To control modal visibility
    @api header = 'Create Candidate'; // To pass custom modal title


    //Candidate fields
    firstName = '';
    middleName = '';
    lastName = '';
    email = '';
    primaryNumber = '';
    address1 = '';
    address2 = '';
    city = '';
    country = '';
    state = '';
    postalCode = '';
    isApp=true;
    @track countryOptions = [];
    @track error;
   @track navigateToPlacement=false;
    @wire(CurrentPageReference)
    currentPageReference;

    connectedCallback() {      
        // add 2 seconds delay
        setTimeout(() => {
            this.loadAccounts();
           if(this.recordId ==undefined){
             this.recordId=this.currentPageReference.state.c__recordId;
             this.navigateToPlacement=true;
            }
            console.log(`c__myParam = ${this.currentPageReference.state.c__recordId}`); 

        }, 2000);
    }

    @wire(getCountryPicklistValues)
    wiredPicklistValues({ error, data }) {
        if (data) {
            this.countryOptions = data.map(country => {
                return { label: country, value: country };
            });
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.countryOptions = [];
        }
    }

    @wire(searchApplications, { name: '', address: '' })
    wiredApplications({ error, data }) {
        if (data) {
            this.applications = data;
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }

    @wire(getallCandidate,{})
    wiredcandidates({ error, data }) {
        if (data) {
            this.candidates = data;

            this.candidates.forEach(element => {
                this.candidateemails.add(element.HRMSUS__Email__c);
            });
        } else if (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }
     
    // Handle input change for Name
    handleNameChange(event) {
        this.searchName = event.target.value;
    }
    handleCountryChange(event){
        this.country = event.target.value;
    }
    // Handle input change for Address
    handleAddressChange(event) {
        this.searchAddress = event.target.value;
    }

    // Search applications by name and address
    handleSearch() {
        searchApplications({ name: this.searchName, address: this.searchAddress })
            .then(result => {
                this.applications = result;
                this.selectedApplications.clear(); // Clear selections after search
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    // Handle checkbox change for selecting applications
    handleCheckboxChange(event) {
        const applicationId = event.target.dataset.id;

        if (event.target.checked) {
            this.selectedApplications.add(applicationId); // Add application ID to the set
        } else {
            this.selectedApplications.delete(applicationId); // Remove application ID from the set
        }
    }

    // Create placement records for selected applications
    createPlacements() {
        const button = this.template.querySelector('[data-id="myButton"]');
        
        if (button) {
            // Perform any action on the button, e.g., disable it
            button.disabled = true;
            
            // Re-enable the button after 5 seconds
            setTimeout(() => {
                button.disabled = false;
            }, 5000);
        }
        if (this.selectedApplications.size === 0) {
            this.showToast('Error', 'No applications selected', 'error');
            return;
        }

        createPlacements({ AppIds: Array.from(this.selectedApplications) ,jobId:this.recordId})
            .then(() => {
                this.showToast('Success', 'Placements created successfully', 'success');
                // Clear the selections after creation
                this.selectedApplications.clear();
                this.template.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                  
                    if(this.navigateToPlacement){
                        this[NavigationMixin.Navigate]({
                            type: 'standard__recordPage',
                            attributes: {
                                recordId: this.recordId,
                                actionName: 'view'
                            }
                        });
            
                    }else{
                    this.dispatchEvent(new CloseActionScreenEvent());
                    }
                });
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    // Helper to show toast notifications
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    handleClose() {
        if(this.navigateToPlacement){
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    actionName: 'view'
                }
            });

        }else{
        this.dispatchEvent(new CloseActionScreenEvent());
       // window.location.reload();
    }
    }

    // Event to save data and close the modal

    
handlepopup(){
    this.isModalOpen = true;
}
    // Method to close the modal
    closeModal() {
        this.isModalOpen = false;
        this.dispatchEvent(new CustomEvent('close')); // Fire event to notify parent
    }

    // Method for the confirm action (can be customized)
    handleConfirm() {
        this.dispatchEvent(new CustomEvent('confirm')); // Fire event for confirm action
        this.closeModal();
    }
    handleInputChange(event) {
        const field = event.target.dataset.id;
        this[field] = event.target.value;
    }
    handleSubmit() {
        // ValidhandleSubmit() {
            const button = this.template.querySelector('[data-id="myappli"]');
        
            if (button) {
                // Perform any action on the button, e.g., disable it
                button.disabled = true;
                
                // Re-enable the button after 5 seconds
                setTimeout(() => {
                    button.disabled = false;
                }, 4000);
            }
        const allInputs = [...this.template.querySelectorAll('lightning-input')];
        let valid = true;
console.log('this.candidateemails.--'+JSON.stringify(this.candidateemails));

        // Validate all required fields
        allInputs.forEach(input => {
            if (input.required && !input.value) {
                input.reportValidity();
                valid = false;
                
            }
            if(input.label =='Email'){
                this.candidateemails.forEach(element => {
                    if(element==input.value){
                        this.showToast('Error', 'Email Id Already Exits', 'error');
                        valid = false;
                    }
                });
                    
                    
                }
            
        });

        if (valid) {
            // Handle form submission logic here (e.g., save to database)
            this.searchName='';
            this.searchAddress='';
            this.candidateemails.add(this.email);
            createCandidate({
                firstName: this.firstName,
                middleName: this.middleName,
                lastName: this.lastName,
                email: this.email,
                primaryNumber: this.primaryNumber,
                address1: this.address1,
                address2: this.address2,
                city: this.city,
                country: this.country,
                state: this.state,
                postalCode: this.postalCode,
                jobId:this.recordId
            })
            .then(() => {
                // Success toast
               this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Candidate created successfully!',
                        variant: 'success'
                    })
                );
               
                    this.dispatchEvent(new CustomEvent('confirm')); // Fire event for confirm action
                   this.closeModal();
                   
                   this.handleSearch();
               
                
            })
            .catch(error => {
                // Handle Apex errors
                console.error('Error:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Error while creating candidate.',
                        variant: 'error'
                    })
                );
            });
           this.isApp=false;

           this.applications=[];
           setTimeout(() => {
            this.loadAccounts();
            this.isApp=true;
            this.firstName='';
                this.middleName='';
                 this.lastName='';
                 this.email='';
                 this.primaryNumber='';
                 this.address1='';
                 this.address2='';
                 this.city='';
                 this.country='';
                 this.state='';
                this.postalCode='';

        }, 3000);
            
            //console.log('Form Submitted:', candidateData);
            // Dispatch an event or call an Apex method to save the form data
        } else {
            console.log('Form has invalid fields.');
        }
    }
    loadAccounts() {
        this.searchName='';
        this.searchAddress='';
        loadApplications({ })
            .then(result => {
                this.applications = result;
                this.selectedApplications.clear(); // Clear selections after search
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }
   
}
