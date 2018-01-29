/* jshint browser: true */

( function( window, $ )
{
    "use strict";

    /*
     *  Represenets an editor
     *  @constructor
     *  @param {DOMNode} element - The TEXTAREA element to add the Wysiwyg to.
     *  @param {object} userOptions - The default options selected by the user.
     */
    function Wysiwyg( element, userOptions ) {

        // This calls the $ function, with the element as a parameter and
        // returns the jQuery object wrapper for element. It also assigns the
        // jQuery object wrapper to the property $editor on `this`.
        this.selectedRange = null;
        this.editor = $( element );
        this.modalMode = 'UPLOAD';
        this.url = '';
        this.editUrl = '';
        this.loading = false;

        var editor = $( element );
        var defaults = {
            hotKeys: {
            "Ctrl+b meta+b": "bold",
            "Ctrl+i meta+i": "italic",
            "Ctrl+u meta+u": "underline",
            "Ctrl+z": "undo",
            "Ctrl+y meta+y meta+shift+z": "redo",
            "Ctrl+l meta+l": "justifyleft",
            "Ctrl+r meta+r": "justifyright",
            "Ctrl+e meta+e": "justifycenter",
            "Ctrl+j meta+j": "justifyfull",
            "Shift+tab": "outdent",
            "tab": "indent"
            },
            toolbarSelector: "[data-role=editor-toolbar]",
            commandRole: "edit",
            activeToolbarClass: "btn-info",
            selectionMarker: "edit-focus-marker",
            selectionColor: "darkgrey",
            dragAndDropImages: true,
            keypressTimeout: 200,
            fileUploadError: function( reason, detail ) { console.log( "File upload error", reason, detail ); }
        };

        var options = $.extend( true, {}, defaults, userOptions );
        var toolbarBtnSelector = "a[data-" + options.commandRole + "],button[data-" + options.commandRole + "],input[type=button][data-" + options.commandRole + "]";
        this.bindHotkeys( editor, options, toolbarBtnSelector );

        if ( options.dragAndDropImages ) {
            //this.initFileDrops( editor, options, toolbarBtnSelector );
            this.initUploadFile(editor, options, toolbarBtnSelector);
            this.initEditFile();
            this.updateModal();
        }

        this.bindToolbar( editor, $( options.toolbarSelector ), options, toolbarBtnSelector );

        editor.attr( "contenteditable", true )
            .on( "mouseup keyup mouseout", function() {
                this.saveSelection();
                this.updateToolbar( editor, toolbarBtnSelector, options );
            }.bind( this ) );

        $( window ).bind( "touchend", function( e ) {
            var isInside = ( editor.is( e.target ) || editor.has( e.target ).length > 0 ),
            currentRange = this.getCurrentRange(),
            clear = currentRange && ( currentRange.startContainer === currentRange.endContainer && currentRange.startOffset === currentRange.endOffset );

            if ( !clear || isInside ) {
                this.saveSelection();
                this.updateToolbar( editor, toolbarBtnSelector, options );
            }
        } );
     }

     /* UPLOAD FILE */

     Wysiwyg.prototype.initUploadFile = function(editor, options, toolbarBtnSelector ) {
       var self = this;

       $('#upload-file').on('change', function (e) {
          var image = e.target.files[0];
          if(!image) return;

          var data = new FormData();
          data.append('url', self.url);
          data.append('type', 'TEMP');
        	data.append('userImage', image);

        	self.uploadImage(data, function (data) {
            self.url = data;
            self.editUrl = '';
            self.updateModal();
        	});
        });

        $('.js-btn-change').on('click', function () {
          $('#upload-file').click();
        });

        $('.js-btn-upload').on('click', function () {
          var data = new FormData();
          data.append('url', self.url);

          self.uploadImage(data, function (url) {
            $('#imgModal').modal('toggle');
            self.url = '';
            self.updateModal();
            editor.focus();
            self.execCommand('insertimage', url, editor, options, toolbarBtnSelector);
            editor.trigger('image-inserted');
          });
        });

        $('.js-btn-edit').on('click', function () {
          self.modalMode = 'EDIT';
          self.updateModal();
        });
     };

     Wysiwyg.prototype.uploadImage = function(data, callback) {
       var self = this;
       if(self.loading){
         return;
       }

       self.setLoading(true);

       $.ajax({
    	    type: "POST",
         	url: "server/upload-image.php",
         	data: data,
         	contentType:false,
         	processData: false,
         	success: function (data) {
             self.setLoading(false);
             callback(data);
          }
      });
    };

     Wysiwyg.prototype.updateModal = function() {
       if(this.modalMode === 'UPLOAD'){
        this.updateUploadMode();
       }

       if(this.modalMode === 'EDIT'){
         this.updateEditMode();
       }
     };

     Wysiwyg.prototype.updateUploadMode = function () {
       $('.content-edit').hide();
       $('.content-upload').show();
       $('.modal-footer').show();

       $('.content-upload img').remove();
       if(this.url === ''){
         $('.btn-upload-image').show();
         $('.modal-footer').hide();
       }else {
          var htmlImage = '<img class="uploaded-image" src="' + this.url + '">';
          $('.content-upload').append(htmlImage);
          $('.btn-upload-image').hide();
          $('.modal-footer').show();
       }
     };

     /* EDIT FILE */

     Wysiwyg.prototype.updateEditMode = function () {
       $('.content-upload').hide();
       $('.modal-footer').hide();
       $('.content-edit').show();

       var url = this.editUrl === '' ? this.url : this.editUrl;
       var htmlImage = '<img class="edit-image" src="' + url + '">';
       $('.content-edit .image-preview img').remove();
       $('.content-edit .image-preview').append(htmlImage);

       var originalImage = '<img class="edit-image" src="' + this.url + '">';
       $('.image-themes .theme img').remove();
       $('.image-themes .theme').prepend(originalImage);
       $('.owl-carousel').owlCarousel({
         loop: true,
         margin: 10,
         nav: true,
         items: 4,
         navText : ["<span class='fa fa-angle-left'></span>", "<span class='fa fa-angle-right'></span>"],
         rewindNav : true
       });
     }

     Wysiwyg.prototype.initEditFile = function() {
       var self = this;

       $('.js-rotate-left').on('click', function (e) {
        var data = {
          command: 'ROTATE LEFT',
          url: self.url,
          editUrl: self.editUrl
        };

        self.uploadEditImage(data);
      });

      $('.js-rotate-right').on('click', function (e) {
         var data = {
           command: 'ROTATE RIGHT',
           url: self.url,
           editUrl: self.editUrl
         };

        self.uploadEditImage(data);
       });

       $('.js-btn-save-edit').on('click', function (e) {
        var width = $('.js-width').val();
        var height = $('.js-height').val();

        var data = {
          command: 'SAVE EDIT',
          url: self.url,
          editUrl: self.editUrl,
          width: width ? width : null,
          height: height ? height : null
        };

       self.uploadEditImage(data, function (serverData) {
         self.url = serverData.url;
         self.editUrl = '';
         self.modalMode = 'UPLOAD';
         self.updateModal();
       });
      });

      $('.js-btn-back').on('click', function () {
        self.modalMode = 'UPLOAD';
        self.updateModal();
      });

      $('body').on('click', '.image-themes .theme', function () {
        var theme = $(this).attr('theme');
        var data = {
          command: theme,
          url: self.url,
          editUrl: self.editUrl
        };
       self.uploadEditImage(data);
      });
    }

     Wysiwyg.prototype.uploadEditImage = function(data, callback) {
       var self = this;
       if(self.loading){
         return;
       }

       self.setLoading(true);

       $.ajax({
         type: "POST",
         url: "server/edit-image.php",
         data: JSON.stringify(data),
         dataType: 'json',
         success: function (data) {
           self.setLoading(false);

           if(callback){
             callback(data);
             return;
           }

           self.editUrl = data.editUrl;
           self.updateModal();
         }
      });
    };

    Wysiwyg.prototype.setLoading = function(loading) {
      if(loading){
        this.loading = true;
        $('#imgModal').addClass('loading');
        return;
      }

      this.loading = false;
      $('#imgModal').removeClass('loading');
   };

    /* =================== */

     Wysiwyg.prototype.readFileIntoDataUrl = function( fileInfo ) {
        var loader = $.Deferred(),
        fReader = new FileReader();

        fReader.onload = function( e ) {
            loader.resolve( e.target.result );
        };

        fReader.onerror = loader.reject;
        fReader.onprogress = loader.notify;
        fReader.readAsDataURL( fileInfo );
        return loader.promise();
     };

     Wysiwyg.prototype.cleanHtml = function( o ) {
        var self = this;
        if ( $( self ).data( "wysiwyg-html-mode" ) === true ) {
            $( self ).html( $( self ).text() );
            $( self ).attr( "contenteditable", true );
            $( self ).data( "wysiwyg-html-mode", false );
        }

        // Strip the images with src="data:image/.." out;
        if ( o === true && $( self ).parent().is( "form" ) ) {
            var gGal = $( self ).html;
            if ( $( gGal ).has( "img" ).length ) {
                var gImages = $( "img", $( gGal ) );
                var gResults = [];
                var gEditor = $( self ).parent();
                $.each( gImages, function( i, v ) {
                    if ( $( v ).attr( "src" ).match( /^data:image\/.*$/ ) ) {
                        gResults.push( gImages[ i ] );
                        $( gEditor ).prepend( "<input value='" + $( v ).attr( "src" ) + "' type='hidden' name='postedimage/" + i + "' />" );
                        $( v ).attr( "src", "postedimage/" + i );
                    }
                } );
            }
        }

        var html = $( self ).html();
        return html && html.replace( /(<br>|\s|<div><br><\/div>|&nbsp;)*$/, "" );
     };

     Wysiwyg.prototype.updateToolbar = function( editor, toolbarBtnSelector, options ) {
        if ( options.activeToolbarClass ) {
            $( options.toolbarSelector ).find( toolbarBtnSelector ).each( function() {
                var self =  $( this );
                var commandArr = self.data( options.commandRole ).split( " " );
                var command = commandArr[ 0 ];

                // If the command has an argument and its value matches this button. == used for string/number comparison
                if ( commandArr.length > 1 && document.queryCommandEnabled( command ) && document.queryCommandValue( command ) === commandArr[ 1 ] ) {
                    self.addClass( options.activeToolbarClass );
                }

                // Else if the command has no arguments and it is active
                else if ( commandArr.length === 1 && document.queryCommandEnabled( command ) && document.queryCommandState( command ) ) {
                    self.addClass( options.activeToolbarClass );
                }

                // Else the command is not active
                else {
                    self.removeClass( options.activeToolbarClass );
                }
            } );
        }
     };

     Wysiwyg.prototype.execCommand = function( commandWithArgs, valueArg, editor, options, toolbarBtnSelector ) {
        var commandArr = commandWithArgs.split( " " ),
            command = commandArr.shift(),
            args = commandArr.join( " " ) + ( valueArg || "" );

        var parts = commandWithArgs.split( "-" );

        if ( parts.length === 1 ) {
            document.execCommand( command, false, args );
        } else if ( parts[ 0 ] === "format" && parts.length === 2 ) {
            document.execCommand( "formatBlock", false, parts[ 1 ] );
        }

        ( editor ).trigger( "change" );
        this.updateToolbar( editor, toolbarBtnSelector, options );
     };

     Wysiwyg.prototype.bindHotkeys = function( editor, options, toolbarBtnSelector ) {
        var self = this;
        $.each( options.hotKeys, function( hotkey, command ) {
            if(!command) return;

            $( editor ).keydown( hotkey, function( e ) {
                if ( editor.attr( "contenteditable" ) && $( editor ).is( ":visible" ) ) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.execCommand( command, null, editor, options, toolbarBtnSelector );
                }
            } ).keyup( hotkey, function( e ) {
                if ( editor.attr( "contenteditable" ) && $( editor ).is( ":visible" ) ) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } );
        } );

        editor.keyup( function() { editor.trigger( "change" ); } );
     };

     Wysiwyg.prototype.getCurrentRange = function() {
        var sel, range;
        if ( window.getSelection ) {
            sel = window.getSelection();
            if ( sel.getRangeAt && sel.rangeCount ) {
                range = sel.getRangeAt( 0 );
            }
        } else if ( document.selection ) {
            range = document.selection.createRange();
        }

        return range;
     };

     Wysiwyg.prototype.saveSelection = function() {
        this.selectedRange = this.getCurrentRange();
     };

     Wysiwyg.prototype.restoreSelection = function() {
        var selection;
        if ( window.getSelection || document.createRange ) {
            selection = window.getSelection();
            if ( this.selectedRange ) {
                try {
                    selection.removeAllRanges();
                }
                catch ( ex ) {
                    document.body.createTextRange().select();
                    document.selection.empty();
                }
                selection.addRange( this.selectedRange );
            }
        } else if ( document.selection && this.selectedRange ) {
            this.selectedRange.select();
        }
     };

     // Adding Toggle HTML based on the work by @jd0000, but cleaned up a little to work in this context.
     Wysiwyg.prototype.toggleHtmlEdit = function( editor ) {
        if ( editor.data( "wysiwyg-html-mode" ) !== true ) {
            var oContent = editor.html();
            var editorPre = $( "<pre />" );
            $( editorPre ).append( document.createTextNode( oContent ) );
            $( editorPre ).attr( "contenteditable", true );
            $( editor ).html( " " );
            $( editor ).append( $( editorPre ) );
            $( editor ).attr( "contenteditable", false );
            $( editor ).data( "wysiwyg-html-mode", true );
            $( editorPre ).focus();
        } else {
            $( editor ).html( $( editor ).text() );
            $( editor ).attr( "contenteditable", true );
            $( editor ).data( "wysiwyg-html-mode", false );
            $( editor ).focus();
        }
     };

     Wysiwyg.prototype.insertFiles = function( files, options, editor, toolbarBtnSelector ) {
        var self = this;
        editor.focus();
        $.each( files, function( idx, fileInfo ) {
            if ( /^image\//.test( fileInfo.type ) ) {
                $.when( self.readFileIntoDataUrl( fileInfo ) ).done( function( dataUrl ) {
                    self.execCommand( "insertimage", dataUrl, editor, options, toolbarBtnSelector );
                    editor.trigger( "image-inserted" );
                } ).fail( function( e ) {
                    options.fileUploadError( "file-reader", e );
                } );
            } else {
                options.fileUploadError( "unsupported-file-type", fileInfo.type );
            }
        } );
     };

     Wysiwyg.prototype.markSelection = function( color, options ) {
        this.restoreSelection(  );
        if ( document.queryCommandSupported( "hiliteColor" ) ) {
            document.execCommand( "hiliteColor", false, color || "transparent" );
        }
        this.saveSelection(  );
     };

     //Move selection to a particular element
     function selectElementContents(element) {
        if (window.getSelection && document.createRange) {
            var selection = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (document.selection && document.body.createTextRange) {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(element);
            textRange.select();
        }
    }

     Wysiwyg.prototype.bindToolbar = function( editor, toolbar, options, toolbarBtnSelector ) {
        var self = this;
        toolbar.find( toolbarBtnSelector ).click( function() {
            self.restoreSelection(  );
            editor.focus();

            if ( editor.data( options.commandRole ) === "html" ) {
                self.toggleHtmlEdit( editor );
            } else {
                self.execCommand( $( this ).data( options.commandRole ), null, editor, options, toolbarBtnSelector );
            }

            self.saveSelection(  );
        } );

        toolbar.find( "[data-toggle=dropdown]" ).on('click', (function () {
            self.markSelection(options.selectionColor, options);
        }));

        toolbar.on( "hide.bs.dropdown", function () {
            self.markSelection( false, options );
        });

        toolbar.find( "input[type=text][data-" + options.commandRole + "]" ).on( "webkitspeechchange change", function() {
            var newValue = this.value;  // Ugly but prevents fake double-calls due to selection restoration
            this.value = "";
            self.restoreSelection(  );

            var text = window.getSelection();
            if (text.toString().trim() === '' && newValue) {
                //create selection if there is no selection
                self.editor.append('<span>' + newValue + '</span>');
                selectElementContents($('span:last', self.editor)[0]);
            }

            if ( newValue ) {
                editor.focus();
                self.execCommand( $( this ).data( options.commandRole ), newValue, editor, options, toolbarBtnSelector );
            }
            self.saveSelection(  );
        } ).on( "blur", function() {
            var input = $( this );
            self.markSelection( false, options );
        } );
        toolbar.find( "input[type=file][data-" + options.commandRole + "]" ).change( function() {
            self.restoreSelection(  );
            if ( this.type === "file" && this.files && this.files.length > 0 ) {
                self.insertFiles( this.files, options, editor, toolbarBtnSelector );
            }
            self.saveSelection(  );
            this.value = "";
        } );

        //  INSERT IMAGE
        // $('body').find( "input[type=file][data-" + options.commandRole + "]" ).change( function() {
        //     self.restoreSelection(  );
        //     if ( this.type === "file" && this.files && this.files.length > 0 ) {
        //         self.insertFiles( this.files, options, editor, toolbarBtnSelector );
        //     }
        //     self.saveSelection(  );
        //     this.value = "";
        // } );
     };

     Wysiwyg.prototype.initFileDrops = function( editor, options, toolbarBtnSelector ) {
         var self = this;
        editor.on( "dragenter dragover", false ).on( "drop", function( e ) {
            var dataTransfer = e.originalEvent.dataTransfer;
            e.stopPropagation();
            e.preventDefault();
            if ( dataTransfer && dataTransfer.files && dataTransfer.files.length > 0 ) {
                self.insertFiles( dataTransfer.files, options, editor, toolbarBtnSelector );
            }
        } );
     };

     /*
      *  Represenets an editor
      *  @constructor
      *  @param {object} userOptions - The default options selected by the user.
      */

     $.fn.wysiwyg = function( userOptions ) {
        var wysiwyg = new Wysiwyg( this, userOptions );
     };

} )( window, window.jQuery );
