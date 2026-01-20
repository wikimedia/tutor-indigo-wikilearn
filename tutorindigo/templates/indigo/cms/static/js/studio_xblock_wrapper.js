(function() {
    'use strict';

    var handlersInitialized = false;
    var directionUpdateUrl = '/meta_translations/direction/';

    function getCsrfToken() {
        var token = $('[name=csrfmiddlewaretoken]').val() || 
                   $('input[name="csrfmiddlewaretoken"]').val() ||
                   $('meta[name="csrf-token"]').attr('content');
        
        if (!token && typeof $.cookie !== 'undefined') {
            token = $.cookie('csrftoken');
        }
        
        return token || '';
    }

    function updateDirectionStatus(xblockElement, destinationFlag) {
        var updateStatus = $.Deferred();
        var locator = xblockElement.data('locator');
        
        if (!locator) {
            updateStatus.reject();
            return updateStatus.promise();
        }

        var loadingMessage = $('<div class="ui-loading"><p><span class="spin"><span class="icon fa fa-refresh" aria-hidden="true"></span></span> <span class="copy">Updating...</span></p></div>');
        xblockElement.find('.wrapper-xblock').prepend(loadingMessage);

        $.ajax({
            url: directionUpdateUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                destination_flag: !destinationFlag,
                locator: locator
            }),
            dataType: 'json',
            headers: {
                'X-CSRFToken': getCsrfToken()
            },
            success: function(response) {
                loadingMessage.remove();
                if (response && 'success' in response) {
                    updateStatus.resolve(response);
                } else {
                    updateStatus.reject();
                }
            },
            error: function(xhr, status, error) {
                loadingMessage.remove();
                console.error('Error updating direction status:', error);
                alert('An error occurred while updating the translation status. Please try again.');
                updateStatus.reject();
            }
        });

        return updateStatus.promise();
    }

    function handleCheckboxMouseDown(event) {
        var checkbox = $(event.currentTarget);
        checkbox.data('original-checked-state', event.currentTarget.checked);
    }

    function handleStatusChangeEvent(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        event.stopPropagation();

        var checkbox = $(event.currentTarget);
        var currentDestinationFlag = checkbox.data('original-checked-state');
        
        if (currentDestinationFlag === undefined || currentDestinationFlag === null) {
            currentDestinationFlag = !event.currentTarget.checked;
        }
        
        var xblockElement = checkbox.closest('.studio-xblock-wrapper');
        if (!xblockElement.length) {
            xblockElement = checkbox.closest('.wrapper-xblock').closest('.studio-xblock-wrapper');
        }

        if (!xblockElement.length) {
            console.error('Could not find xblock element');
            return;
        }

        var actionText = currentDestinationFlag ? 
            'Disable Translations for this block?' : 
            'Enable Translations for this block?';
        var descriptionText = currentDestinationFlag ?
            'Block data would not be sent to server for translations' :
            'Block data would be sent to server for translations';

        if (confirm(actionText + '\n\n' + descriptionText)) {
            updateDirectionStatus(xblockElement, currentDestinationFlag)
                .done(function(data) {
                    if (data && 'success' in data) {
                        checkbox.prop('checked', !currentDestinationFlag);
                    }
                })
                .fail(function() {
                    checkbox.prop('checked', currentDestinationFlag);
                });
        } else {
            checkbox.prop('checked', currentDestinationFlag);
        }
        
        checkbox.removeData('original-checked-state');
    }

    function initializeCheckboxDirectionButtons() {
        if (handlersInitialized) {
            return;
        }
        
        $(document).on('mousedown', '.checkbox-direction-button', handleCheckboxMouseDown);
        $(document).on('click', '.checkbox-direction-button', handleStatusChangeEvent);
        
        handlersInitialized = true;
    }

    $(document).ready(initializeCheckboxDirectionButtons);

    // Also initialize if script loads after DOM is ready (but only if not already initialized)
    if (!handlersInitialized && (document.readyState === 'complete' || document.readyState === 'interactive')) {
        initializeCheckboxDirectionButtons();
    }

})();
