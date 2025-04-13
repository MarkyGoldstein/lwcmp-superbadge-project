import { LightningElement, wire, track } from 'lwc';
import getBoatTypes from '@salesforce/apex/BoatDataService.getBoatTypes';

export default class BoatSearchForm extends LightningElement {
    @track selectedBoatTypeId = ''; // Use @track if needed for complex reactivity, often optional now

    // Private
    error = undefined;

    @track searchOptions; // Track changes to the options array for rendering

    // Wire adapter to fetch boat types
    @wire(getBoatTypes)
    boatTypes({ error, data }) {
        if (data) {
            // Map the Apex results to the format required by lightning-combobox
            this.searchOptions = data.map(type => {
                // Complete the logic: Return label/value pairs
                return { label: type.Name, value: type.Id };
            });
            // Add the 'All Types' option to the beginning of the list
            this.searchOptions.unshift({ label: 'All Types', value: '' });
            this.error = undefined; // Clear previous errors if data loads successfully
        } else if (error) {
            this.searchOptions = undefined;
            this.error = error;
            console.error('Error loading boat types:', JSON.stringify(error)); // Log the error
        }
    }

    // Fires event that the search option has changed.
    // Passes boatTypeId (value of selected item) in the detail
    handleSearchOptionChange(event) {
        // Get the selected boat type id from the event
        this.selectedBoatTypeId = event.detail.value;

        // Create and dispatch the custom event 'search'
        const searchEvent = new CustomEvent('search', {
            detail: { boatTypeId: this.selectedBoatTypeId }
        });
        this.dispatchEvent(searchEvent);
    }
}
