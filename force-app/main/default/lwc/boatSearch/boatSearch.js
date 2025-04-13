import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

 // imports
 export default class BoatSearch extends NavigationMixin(LightningElement) {
    isLoading = false;
    boatTypeId = '';

    // Handles loading event
   handleLoading() {
        this.isLoading = true;
    }
    
    // Handles done loading event
    handleDoneLoading() {
        this.isLoading = false;
    }
        
    // Handles search boat event
    // This custom event comes from the form
    searchBoats(event) {
        this.boatTypeId = event.detail.boatTypeId;
        // Find the results component and call a method to search
        const boatSearchResultsCmp = this.template.querySelector('c-boat-search-results');
        if (boatSearchResultsCmp) {
            boatSearchResultsCmp.searchBoats(this.boatTypeId);
        }
    }

    createNewBoat() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Boat__c',
                actionName: 'new'
            }
        });
    }

  }
  