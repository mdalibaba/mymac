import { api, LightningElement, track ,wire} from 'lwc';
import searchCandidates from '@salesforce/apex/CreatePlacementFromCan.searchCandidates';
import loadCandidates from '@salesforce/apex/CreatePlacementFromCan.loadCandidates';
import loadCandidateswithGeo from '@salesforce/apex/CreatePlacementFromCan.loadCandidateswithGeo';
import createPlacements from '@salesforce/apex/CreatePlacementFromCan.createPlacements';
import getallCandidate from '@salesforce/apex/CreatePlacementFromCan.getallCandidate';
import createCandidate from '@salesforce/apex/CreatePlacementFromCan.createCandidate';
import getCountryPicklistValues from '@salesforce/apex/CreatePlacementFromCan.getCountryPicklistValues';
import getLatLngFromZipCode from '@salesforce/apex/CreatePlacementFromCan.getLatLngFromZipCode';

import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import { CloseActionScreenEvent } from 'lightning/actions';


export default class CreatePlacementFromCan extends  NavigationMixin(LightningElement) {

@api recordId;
@track searchName = '';
@track searchAddress = '';
@track position='';
@track zipcode='';
@track  candidates=[];
allCanndidates = [];
candidateemails = new Set(); 

@track selectedApplications = new Set(); // Set to store selected Application IDs
@api headerText='CREATE PLACEMENT'; 

@api isModalOpen = false; // To control modal visibility
@api header = 'Create Candidate'; // To pass custom modal title
zoomLevel=11;

//Candidate fields
firstName = '';
middleName = '';
lastName = '';
email = '';
primaryNumber = '';
address1 = '';
address2 = '';
city = '';
country = 'United States';
state = '';
postalCode = '';
dob = '';
isApp=true;
@track countryOptions = [];
@track error;
////////////////////
options = [
    { label: 'None', value: '' },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 }
];
 Ustates = [
    { label: 'None', value: '' }, { label: 'Alabama', value: 'AL' },
    { label: 'Alaska', value: 'AK' }, { label: 'Arizona', value: 'AZ' },
    { label: 'Arkansas', value: 'AR' }, { label: 'California', value: 'CA' },
    { label: 'Colorado', value: 'CO' }, { label: 'Connecticut', value: 'CT' },
    { label: 'Delaware', value: 'DE' }, { label: 'Florida', value: 'FL' },
    { label: 'Georgia', value: 'GA' }, { label: 'Hawaii', value: 'HI' },
    { label: 'Idaho', value: 'ID' }, { label: 'Illinois', value: 'IL' },
    { label: 'Indiana', value: 'IN' }, { label: 'Iowa', value: 'IA' },
    { label: 'Kansas', value: 'KS' }, { label: 'Kentucky', value: 'KY' },
    { label: 'Louisiana', value: 'LA' }, { label: 'Maine', value: 'ME' },
    { label: 'Maryland', value: 'MD' }, { label: 'Massachusetts', value: 'MA' },
    { label: 'Michigan', value: 'MI' }, { label: 'Minnesota', value: 'MN' },
    { label: 'Mississippi', value: 'MS' }, { label: 'Missouri', value: 'MO' },
    { label: 'Montana', value: 'MT' }, { label: 'Nebraska', value: 'NE' },
    { label: 'Nevada', value: 'NV' }, { label: 'New Hampshire', value: 'NH' },
    { label: 'New Jersey', value: 'NJ' }, { label: 'New Mexico', value: 'NM' },
    { label: 'New York', value: 'NY' }, { label: 'North Carolina', value: 'NC' },
    { label: 'North Dakota', value: 'ND' },  { label: 'Ohio', value: 'OH' },
    { label: 'Oklahoma', value: 'OK' }, { label: 'Oregon', value: 'OR' },
    { label: 'Pennsylvania', value: 'PA' }, { label: 'Rhode Island', value: 'RI' },
    { label: 'South Carolina', value: 'SC' }, { label: 'South Dakota', value: 'SD' },
    { label: 'Tennessee', value: 'TN' },  { label: 'Texas', value: 'TX' },
    { label: 'Utah', value: 'UT' }, { label: 'Vermont', value: 'VT' },
    { label: 'Virginia', value: 'VA' }, { label: 'Washington', value: 'WA' },
    { label: 'West Virginia', value: 'WV' }, { label: 'Wisconsin', value: 'WI' },
    { label: 'Wyoming', value: 'WY' }
];

latitude;
longitude;
geoerror;
locationAvailable = false;
selectedRadius;
geodata=[];
maploc=[];


@track navigateToPlacement=false;
@wire(CurrentPageReference)
currentPageReference;
///////////

@track data = []; // Entire dataset
@track paginatedData = []; // Data for the current page
currentPage = 1;
pageSize = 20; // Number of records per page

get mapMarkers(){
     
    return[
        {
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude,
            },
        },
    ];
    
}
get totalPages() {
    return Math.ceil(this.candidates.length / this.pageSize);
}

get isFirstPage() {
    return this.currentPage === 1;
}

get isLastPage() {
    return this.currentPage === this.totalPages;
}
nextPage() {
    if (this.currentPage < this.totalPages) {
        this.currentPage += 1;
        this.updatePaginatedData();
      // this.checkBoxFunction();
    }
}

previousPage() {
    if (this.currentPage > 1) {
        this.currentPage -= 1;
        this.updatePaginatedData();
    }
}

updatePaginatedData() {
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = startIdx + this.pageSize;
    this.paginatedData = this.candidates.slice(startIdx, endIdx);
    
    if(this.candidates.length==1){
        this.paginatedData = this.candidates;
    }
    //selectedradius not empty 
    this.paginatedData.forEach(element=>{

    });
        
    if( this.selectedRadius!==undefined && this.selectedRadius!=='' && this.geodata.length>0 ){
        this.paginatedData =this.geodata.slice(startIdx, endIdx);
       
    }else if(this.zipcode!==undefined && this.selectedRadius!==undefined && this.selectedRadius!=='' && this.geodata.length==0){
        //toast message no data found for selected radius
        //this.selectedRadius='';
       this.paginatedData =[];
        this.showToast('Error', 'No data found for selected radius', 'error');

    }
     // after 2 seconds call updateCheckboxSelections function
    setTimeout(() => {
        this.updateCheckboxSelections();
    }, 1000);
                
//this.updateCheckboxSelections();

}

connectedCallback() {     
       
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
@wire(searchCandidates, { name: '', address: ''  ,zipcode:''})
wiredCandidates({ error, data }) {
    if (data) {
        this.candidates = data;
        this.updatePaginatedData();
    } else if (error) {
        this.showToast('Error', error.body.message, 'error');
    }
}
@wire(getallCandidate,{})
wiredallcandidates({ error, data }) {
    if (data) {
        this.allCanndidates = data;

        this.allCanndidates.forEach(element => {
            this.candidateemails.add(element.HRMSUS__Email__c);
        });
    } else if (error) {
        this.showToast('Error', error.body.message, 'error');
    }
}
reloadPage() {
    // Reload the entire page
    window.location.reload();
}

// Handle input change for Name
handleNameChange(event) {
    this.searchName = event.target.value;
    this.selectedRadius='';
}
handleCountryChange(event){
    this.country = event.target.value;
}
// Handle input change for Address
handleAddressChange(event) {
    this.searchAddress = event.target.value;
    this.selectedRadius='';
}
handleZipCodeChange(event){
    let weekvalue=event.target.value;
    if(weekvalue==''){
        this.zipcode='';
        return 
    }
    this.selectedRadius='';

    const regex = /^[0-9]*$/;  // Allow only digits
    if (regex.test(weekvalue)) {
        //this.weekvalue = weekvalue;  // Assign valid numeric zip code
        
        let lenword=weekvalue.length;
    
    
    this.zipcode = parseInt(event.target.value);

    if(lenword==5 || lenword==6 ){
        this.getCoordinates() ; 
          //  this.getCoordinates() ; 
          //  this.locationAvailable=true;

    }
    } else {
    event.target.value='';
        this.zipcode = '';  // Clear zip code if invalid input
        this.locationAvailable=false;
        console.error('Invalid zip code. Please enter numbers only.');
    }


    //let weekvalue=event.target.value;
    
}

// Search applications by name and address
handleSearch() {

    const button = this.template.querySelector('[data-id="mySearch"]');
    
    if (button) {
        // Perform any action on the button, e.g., disable it
        button.disabled = true;
        this.paginatedData=[];
        // Re-enable the button after 5 seconds
        setTimeout(() => {
            button.disabled = false;
        }, 3000);
    }

    if (this.zipcode !== '' && this.selectedRadius !== ''  && !isNaN(this.zipcode) && !isNaN(this.selectedRadius) ) {
        
       
      // let rad= this.selectedRadius;
    let myarr=[];
    this.loadCandidateswithGeo();
    //add 1 second delay to call loadApplicationsGeo
    setTimeout(() => {
         
   


    console.log(this.candidates.length);
    //this.candidates.length;
    
    this.candidates.forEach(element => {
        console.log(JSON.stringify(element));
        console.log( element.rightpm__GeoLocations__latitude__s);
        console.log( element.rightpm__GeoLocations__longitude__s);
       
        const latitude1 = element.rightpm__GeoLocations__Latitude__s;
const longitude1 = element.rightpm__GeoLocations__Longitude__s;

        let distance=this.calculateDistance(this.latitude,this.longitude,latitude1,longitude1);
        console.log('distance--'+distance);
        if(this.selectedRadius==25){
        if(distance<=25   ){
            myarr.push(element);
        }
    }else if(this.selectedRadius==50){
            if(distance<=50  ){
                myarr.push(element);
            }
        }else if(this.selectedRadius==100){
            if(distance<=100){
                myarr.push(element);
            }
        }
        
        else if(this.selectedRadius==200){
            if(distance<=200  ){
                myarr.push(element);
            }
        }
        else if(this.selectedRadius==500){
            if(distance<=500  ){
                myarr.push(element);
            }
        }
    });
    this.geodata=myarr;
    this.updatePaginatedData();
        return false;
    }, 1000);
    }else{
    this.selectedRadius='';
    searchCandidates({ name: this.searchName, address: this.searchAddress ,zipcode:this.zipcode})
        .then(result => {
            this.candidates = result;
            this.selectedApplications.clear(); // Clear selections after search
            this.updatePaginatedData();
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
    }
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

    createPlacements({ CanIds: Array.from(this.selectedApplications) ,jobId:this.recordId})
        .then(() => {
            this.showToast('Success', 'Placements created successfully', 'success');
            // Clear the selections after creation
            this.selectedApplications.clear();
            
            this.template.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
                
               
            });
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
        //this[field] = parseInt(event.target.value);
        if(field=='postalCode'){
            const regex = /^[0-9]*$/;  // Allow only digits
            if (regex.test(event.target.value)) {
                    this[field] = parseInt(event.target.value);
            }else{
                this[field] = '';
                event.target.value='';
            }
    
        }else{
            this[field] = event.target.value;
        }
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
        const state = this.template.querySelector('[data-id="state"]');
        const country = this.template.querySelector('[data-id="country"]');
       
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
        if(state.required && !state.value){
            state.reportValidity();
            valid = false;
        }if(country.required && !country.value){
            country.reportValidity();
            valid = false;
        }
    
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
                jobId:this.recordId,
                            DteofBth:this.dob
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
                    this.updatePaginatedData();
                
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
        loadCandidates({ })
            .then(result => {
                this.candidates = result;
                this.selectedApplications.clear(); // Clear selections after search
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3958.8; // Radius of the Earth in miles
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLon = this.degreesToRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(2); // Distance in miles, rounded to 2 decimals
    }

    handleGeoChange(event){

    
        if(event.target.value==''){
            this.selectedRadius=event.target.value;
        }else{
            let rad= parseInt(event.target.value);
            this.selectedRadius=event.target.value;
        }
       
         
    }
    loadCandidateswithGeo() {
        loadCandidateswithGeo({ })
            .then(result => {
                this.candidates = result;
                this.selectedApplications.clear(); // Clear selections after search
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    handleGeo(event){
        if(event.target.checked)
        {
            navigator.geolocation.getCurrentPosition(position => {
                this.latitude = position.coords.latitude;
                this.longitude = position.coords.longitude;
                this.locationAvailable=event.target.checked;
            });
        }else{
            this.latitude='';
            this.longitude='';
            this.locationAvailable=false;
        }
    
    }
/////////get lat long
    getCoordinates() {
        if (this.zipcode) {
            getLatLngFromZipCode({ zipCode: this.zipcode })
                .then((result) => {
                    if (result) {
                        this.latitude = result.latitude;
                        this.longitude = result.longitude;
                        console.log('Latitude:', this.latitude);
                        console.log('Longitude:', this.longitude);
                    } else {
                        console.error('No coordinates found for the given zip code');
                        this.showToast('Error', 'No coordinates found for the given zip code.', 'error');
                    }
                })
                .catch((error) => {
                    this.showToast('Error', error.body.message, 'error');
                });
        } else {
            console.error('Please enter a valid zip code.');
            this.showToast('Error', 'Please enter a valid zip code.', 'error');
        }
        }

        updateCheckboxSelections() {
            // After rendering is done, check the checkboxes that match selected items
            this.paginatedData.forEach(item => {
                const checkbox = this.template.querySelector(`[data-id="${item.Id}"]`);
                
                if (checkbox) {
                    checkbox.checked = this.selectedApplications.has(item.Id);
                }
            });
        }

        navigateToApp(event) {

            const applicationId = event.currentTarget.dataset.id;
           this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: applicationId,
                     actionName: 'view'
                 }});
        
              /* let site=  window.location.origin;
              let orgUrl=site+'/lightning/r/HRMSUS__Applications__c/'+applicationId+'/view';
               window.open(orgUrl, '_blank');*/
        }

        viewDistance(event){
            let cid =event.currentTarget.dataset.id;
            let lat ;
            let long;
            let distance;
        console.log(this.latitude+','+this.longitude,);
            this.candidates.forEach(element => {
                if(element.Id==cid){
                console.log( element.rightpm__GeoLocations__latitude__s);
                console.log( element.rightpm__GeoLocations__longitude__s);
                lat=parseFloat(element.rightpm__GeoLocations__latitude__s);
                long=parseFloat(element.rightpm__GeoLocations__longitude__s);
                distance=this.calculateDistance(this.latitude,this.longitude,parseFloat(element.rightpm__GeoLocations__latitude__s),parseFloat(element.rightpm__GeoLocations__longitude__s));
                  }});
        
                  
            alert('distance--'+distance);
         
        
        }



}