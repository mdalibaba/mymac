import { LightningElement ,api} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
export default class NavigateToexecutiveSummary extends NavigationMixin(LightningElement) {
    @api recordId;
    connectedCallback() {  
        //add 2 seconds delay to open the page in a new tab
        setTimeout(() => {
            const url = `/lightning/n/rightpm__ExecutiveSummary?c__recordId=${this.recordId}`;
        window.open(url, '_blank');
        this.dispatchEvent(new CloseActionScreenEvent());
        }, 2000);
        
    }
    handleOpenNewTab1() {
       // const recordId = '001XXXXXXXXXXXXXXX'; // Replace with the desired record ID
        const url = `/lightning/n/rightpm__ExecutiveSummary?recordId=${this.recordId}`;
        window.open(url, '_blank');
    }

    handleOpenNewTab() {
       // const recordId = '001XXXXXXXXXXXXXXX'; // Replace with your desired record ID
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: 'rightpm__ExecutiveSummary'
            },
            state: {
                c__recordId: this.recordId
            }
        });
    }
}