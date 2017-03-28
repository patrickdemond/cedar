'use strict';

var cenozo = angular.module( 'cenozo' );

cenozo.controller( 'HeaderCtrl', [
  '$scope', 'CnBaseHeader',
  function( $scope, CnBaseHeader ) {
    // copy all properties from the base header
    CnBaseHeader.construct( $scope );
  }
] );

/* ######################################################################################################## */
cenozoApp.initDataModule = function( module, name ) {
  angular.extend( module, {
    identifier: {},
    name: {
      singular: name + ' Data',
      plural: name + ' Data',
      possessive: name + ' Data\'s',
      pluralPossessive: name + ' Data\'s'
    }
  } );
};

/* ######################################################################################################## */
cenozoApp.initRankDataViewDirectiveController = function( scope, CnHttpFactory, CnModalConfirmFactory, $timeout ) {
  scope.isComplete = false;
  scope.isWorking = false;
  scope.typeaheadIsLoading = false;
  scope.model.viewModel.onView().finally( function() { scope.isComplete = true; } );

  function postSubmit( selected ) {
    if( !selected ) scope.preventSelectedNewWord = false;
    document.getElementById( 'newWord' ).focus();
  }

  angular.extend( scope, {
    cursor: null,
    preventSelectedNewWord: false,
    toggleCursor: function( rank ) {
      scope.cursor = rank == scope.cursor ? null : rank;
      postSubmit( false );
    },
    submitNewWord: function( selected ) {
      // string if it's a new word, integer if it's an existing intrusion
      if( !scope.typeaheadIsLoading && ( angular.isObject( scope.newWord ) || 0 < scope.newWord.length ) ) {
        // prevent double-entry from enter key and typeahead selection
        if( selected ) {
          if( scope.preventSelectedNewWord ) return;
        } else scope.preventSelectedNewWord = true;
        scope.submitWord( scope.newWord, selected );
      }
    },
    submitWord: function( word, selected ) {
      if( angular.isUndefined( selected ) ) selected = false;
      if( angular.isString( word ) && null != word.match( /^-+$/ ) ) word = { id: null };
      scope.isWorking = true;
      scope.newWord = '';
      scope.model.viewModel.submitIntrusion( word, scope.cursor ).finally( function() {
        scope.cursor = null; // return the cursor to the end of the list
        scope.isWorking = false;
        $timeout( function() { postSubmit( selected ) }, 20 );
      } );
    },
    removeWord: function( word ) {
      CnModalConfirmFactory.instance( {
        title: 'Remove ' + ( 'placeholder' == word.word_type ? 'placeholder' : '"' + word.word + '"' ) ,
        message: 'Are you sure you want to remove ' +
                 ( 'placeholder' == word.word_type ? 'the placeholder' : '"' + word.word + '"' ) +
                 ' from the word list?'
      } ).show().then( function( response ) {
        if( response ) {
          scope.isWorking = false;
          scope.model.viewModel.deleteIntrusion( word ).finally( function() {
            // we may have to change the cursor if it is no longer valid
            if( null != scope.cursor ) {
              var len = scope.model.viewModel.record.length;
              if( 0 == len || scope.model.viewModel.record[len-1].rank < scope.cursor )
                scope.cursor = null;
            }

            scope.isWorking = false;
            postSubmit( false );
          } );
        }
      } );
    },
    getTypeaheadValues: function( viewValue ) {
      scope.typeaheadIsLoading = true;
      return CnHttpFactory.instance( {
        path: 'word',
        data: {
          select: { column: [ 'id', 'word', { table: 'language', column: 'code' } ] },
          modifier: {
            where: [ {
              column: 'language_id',
              operator: 'IN',
              value: scope.model.testEntryModel.viewModel.languageIdList
            }, {
              column: 'misspelled', operator: '=', value: false
            }, {
              column: 'word', operator: 'LIKE', value: viewValue + '%'
            } ],
            order: { word: false }
          }
        }
      } ).query().then( function( response ) {
        scope.typeaheadIsLoading = false;
        return response.data;
      } );
    }
  } );
};

/* ######################################################################################################## */
cenozo.directive( 'cnSubmitWord', [
  function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function( scope, element, attrs ) {
        element.bind( 'keydown', function( event ) {
          scope.$evalAsync( function() { if( 13 == event.which ) scope.$eval( attrs.cnSubmitWord ); } );
        } );
      }
    }
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseDataViewFactory', [
  'CnBaseViewFactory', 'CnHttpFactory', 'CnModalMessageFactory', 'CnModalNewIntrusionFactory',
  function( CnBaseViewFactory, CnHttpFactory, CnModalMessageFactory, CnModalNewIntrusionFactory ) {
    return {
      construct: function( object, parentModel, root ) {
        CnBaseViewFactory.construct( object, parentModel, root );
        angular.extend( object, {
          getTestEntryPath: function() {
            var path = parentModel.getServiceCollectionPath();
            return path.substring( 0, path.lastIndexOf( '/' ) );
          },
          // write a custom onView function
          onView: function() {
            object.isLoading = true;

            // start by confirming whether or not this is the correct test type for the test entry
            return parentModel.testEntryModel.viewModel.onViewPromise.then( function() {
              if( parentModel.getDataType() == parentModel.testEntryModel.viewModel.record.data_type ) {
                return object.$$onView().then( function() {
                  delete object.record.getIdentifier; // we don't need the identifier function

                  // convert boolean to integer
                  if( angular.isObject( object.record ) )
                    for( var property in object.record )
                      if( 'boolean' == typeof( object.record[property] ) )
                        object.record[property] = object.record[property] ? 1 : 0;
                } );
              }
            } );
          }
        } );

        if( 'aft' == parentModel.getDataType() || 'fas' == parentModel.getDataType() ) {
          angular.extend( object, {
            submitIntrusion: function( word, rank ) {
              // private method used below
              function sendIntrusion( input, rank ) {
                var data = angular.isDefined( input.id ) ? { word_id: input.id } : input;
                if( null != rank ) data.rank = rank;

                return CnHttpFactory.instance( {
                  path: object.parentModel.getServiceResourcePath(),
                  data: data,
                  onError: function( response ) {
                    if( 406 == response.status ) {
                      // the word is misspelled
                      return CnModalMessageFactory.instance( {
                        title: 'Misspelled Word',
                        message: 'You have selected a misspelled word. This word cannot be used.'
                      } ).show();
                    } else CnModalMessageFactory.httpError( response );
                  }
                } ).post().then( function( response ) {
                  if( null != rank ) {
                    var index = object.record.findIndexByProperty( 'rank', rank );
                    if( null != index ) {
                      object.record.forEach( function( word ) { if( word.rank >= rank ) word.rank++; } );
                      object.record.splice( index, 0, response.data );
                    } else {
                      console.warning(
                        'Tried inserting word at rank "' + rank + '", which was not found in the list'
                      );
                    }
                  } else {
                    object.record.push( response.data );
                  }
                } );
              }

              if( angular.isString( word ) ) {
                // remove case and double quotes if they are found at the start/end
                word = word.replace( /^"|"$/g, '' ).toLowerCase();

                // it's a new word, so double-check with the user before proceeding
                return CnModalNewIntrusionFactory.instance( {
                  word: word,
                  language_id: object.parentModel.testEntryModel.viewModel.record.participant_language_id,
                  languageIdRestrictList: object.parentModel.testEntryModel.viewModel.languageIdList
                } ).show().then( function( response ) {
                  if( null != response ) return sendIntrusion( { language_id: response, word: word }, rank );
                } );
              } else return sendIntrusion( word, rank ); // it's not a new word so send it immediately
            },
            deleteIntrusion: function( wordRecord ) {
              return CnHttpFactory.instance( {
                path: object.parentModel.getServiceResourcePath() + '/' + wordRecord.id
              } ).delete().then( function() {
                var index = object.record.findIndexByProperty( 'id', wordRecord.id );
                if( null != index ) {
                  object.record.splice( index, 1 );
                  object.record.forEach( function( word ) { if( word.rank > wordRecord.rank ) word.rank--; } );
                } else {
                  console.warning( 'Tried removing word which was not found in the list' );
                }
              } );
            }
          } );
        }
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.factory( 'CnBaseDataModelFactory', [
  'CnBaseModelFactory', 'CnSession', '$state',
  function( CnBaseModelFactory, CnSession, $state ) {
    return {
      construct: function( object, module ) {
        CnBaseModelFactory.construct( object, module );
        angular.extend( object, {
          getDataType: function() {
            var path = object.getServiceCollectionPath();
            var type = path.substring( path.lastIndexOf( '/' ) + 1 );
            return type.substring( 0, type.indexOf( '_' ) );
          },
          getServiceResourcePath: function( resource ) {
            var path = object.getServiceCollectionPath();
            var type = path.substring( path.lastIndexOf( '/' ) + 1 );
            return 'premat_data' == type || 'rey_data' == type
                 ? type + '/test_entry_id=' + $state.params.identifier
                 : 'test_entry/' + $state.params.identifier + '/' + type;
          },
          isTypist: function() { return 'typist' == CnSession.role.name; }
        } );

        if( 'aft' == object.getDataType() || 'fas' == object.getDataType() ) {
          angular.extend( object, {
            getServiceData: function( type, columnRestrictLists ) {
              var data = object.$$getServiceData( type, columnRestrictLists );
              if( 'view' == type ) {
                if( angular.isUndefined( data.modifier ) ) data.modifier = {};
                var order = {};
                order[object.getDataType() + '_data.rank'] = false;
                angular.extend( data.modifier, {
                  order: order,
                  limit: 10000 // do not limit the number of records returned
                } );
                data.select = { column: [
                  'rank',
                  { table: 'word', column: 'word' },
                  { table: 'language', column: 'code' },
                  'word_type'
                ] };
              }
              return data;
            }
          } );
        }
      }
    };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalNewIntrusionFactory', [
  '$modal', 'CnHttpFactory',
  function( $modal, CnHttpFactory ) {
    var object = function( params ) {
      var self = this;
      this.title = 'New Intrusion';
      this.word = null;
      this.language_id = null;
      this.languageIdRestrictList = [];
      this.languageList = [];

      angular.extend( this, params );

      this.show = function() {
        var where = [ { column: 'active', operator: '=', value: true } ];
        if( 0 < this.languageIdRestrictList.length )
          where.push( { column: 'id', operator: 'IN', value: this.languageIdRestrictList } );
        return CnHttpFactory.instance( {
          path: 'language',
          data: {
            select: { column: [ 'id', 'name' ] },
            modifier: { where: where, order: { name: false } }
          }
        } ).query().then( function( response) {
          self.languageList = [];
          response.data.forEach( function( item ) {
            self.languageList.push( { value: item.id, name: item.name } );
          } );

          return $modal.open( {
            backdrop: 'static',
            keyboard: true,
            modalFade: true,
            templateUrl: cenozoApp.getFileUrl( 'cedar', 'modal-new-intrusion.tpl.html' ),
            controller: function( $scope, $modalInstance ) {
              $scope.model = self;
              $scope.proceed = function() { $modalInstance.close( $scope.model.language_id ); };
              $scope.cancel = function() { $modalInstance.close( null ); };
            }
          } ).result;
        } );
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalSelectTypistFactory', [
  '$modal', 'CnSession', 'CnHttpFactory',
  function( $modal, CnSession, CnHttpFactory ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Select Typist';
      this.message = 'Please select a typist:';
      this.site_id = CnSession.site.id;
      this.languageIdRestrictList = [];
      this.userList = [];

      angular.extend( this, params );

      this.show = function() {
        return CnHttpFactory.instance( {
          path: 'user',
          data: {
            select: { column: [ 'id', 'name', 'first_name', 'last_name' ] },
            modifier: {
              join: [ {
                table: 'access',
                onleft: 'user.id',
                onright: 'access.user_id'
              }, {
                table: 'role',
                onleft: 'access.role_id',
                onright: 'role.id'
              } ],
              where: [ {
                column: 'role.name',
                operator: '=',
                value: 'typist'
              }, {
                column: 'access.site_id',
                operator: '=',
                value: self.site_id
              } ],
              order: 'name'
            }
          }
        } ).query().then( function( response ) {
          self.userList = [ { name: "(Select Typist)", value: undefined } ];
          response.data.forEach( function( item ) {
            self.userList.push( {
              value: item.id,
              name: item.first_name + ' ' + item.last_name + ' (' + item.name + ')'
            } );
          } );
        } ).then( function() {
          return $modal.open( {
            backdrop: 'static',
            keyboard: true,
            modalFade: true,
            templateUrl: cenozoApp.getFileUrl( 'cedar', 'modal-select-typist.tpl.html' ),
            controller: function( $scope, $modalInstance ) {
              $scope.model = self;
              $scope.proceed = function() { $modalInstance.close( $scope.user_id ); };
              $scope.cancel = function() { $modalInstance.close( null ); };
            }
          } ).result;
        } );
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
cenozo.service( 'CnModalSelectWordFactory', [
  '$modal', 'CnHttpFactory',
  function( $modal, CnHttpFactory ) {
    var object = function( params ) {
      var self = this;
      this.title = 'Select Word';
      this.message = 'Please select a word:';
      this.word = null;
      this.languageIdRestrictList = [];

      angular.extend( this, params );

      this.show = function() {
        return $modal.open( {
          backdrop: 'static',
          keyboard: true,
          modalFade: true,
          templateUrl: cenozoApp.getFileUrl( 'cedar', 'modal-select-word.tpl.html' ),
          controller: function( $scope, $modalInstance ) {
            $scope.model = self;
            $scope.proceed = function() { $modalInstance.close( $scope.word ); };
            $scope.cancel = function() { $modalInstance.close( null ); };
            $scope.formatLabel = function( word ) {
              return angular.isObject( word ) ? word.word + ' [' + word.code + ']' : '';
            };
            $scope.getTypeaheadValues = function( viewValue ) {
              $scope.typeaheadIsLoading = true;
              var where = [
                { column: 'misspelled', operator: '=', value: false },
                { column: 'word', operator: 'LIKE', value: viewValue + '%' }
              ];
              if( 0 < $scope.model.languageIdRestrictList.length ) where.push( {
                column: 'language_id',
                operator: 'IN',
                value: $scope.model.languageIdRestrictList.length
              } );

              return CnHttpFactory.instance( {
                path: 'word',
                data: {
                  select: { column: [ 'id', 'word', { table: 'language', column: 'code' } ] },
                  modifier: { where: where, order: { word: false } }
                }
              } ).query().then( function( response ) {
                $scope.typeaheadIsLoading = false;
                return response.data;
              } );
            }
          }
        } ).result;
      };
    };

    return { instance: function( params ) { return new object( angular.isUndefined( params ) ? {} : params ); } };
  }
] );
