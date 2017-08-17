import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        openFile(file) {
            this.transitionToRoute('file-detail', file);
        }
    }
});
