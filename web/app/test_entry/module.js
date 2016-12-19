define( [ 'aft_data', 'mat_data', 'rey1_data', 'rey2_data' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'test_entry', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'transcription',
        column: 'transcription_id',
      }
    },
    name: {
      singular: 'test entry',
      plural: 'test entries',
      possessive: 'test entry\'s',
      pluralPossessive: 'test entries\''
    },
    columnList: {
      test_type_rank: {
        column: 'test_type.rank',
        title: 'Rank'
      },
      test_type_name: {
        column: 'test_type.name',
        title: 'Type'
      },
      submitted: {
        title: 'Submitted',
        type: 'boolean'
      }
    },
    defaultOrder: {
      column: 'test_type.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    test_type_rank: {
      column: 'test_type.rank',
      title: 'Rank',
      constant: true
    },
    test_type_name: {
      column: 'test_type.name',
      title: 'Type',
      constant: true
    },
    submitted: {
      title: 'Submitted',
      type: 'boolean',
      constant: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryList', [
    'CnTestEntryModelFactory',
    function( CnTestEntryModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestEntryView', [
    'CnTestEntryModelFactory', 'CnSession', '$q',
    function( CnTestEntryModelFactory, CnSession, $q ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestEntryModelFactory.root;

          $scope.isComplete = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          $scope.refresh = function() {
            if( $scope.isComplete ) {
              $scope.isComplete = false;
              var type = $scope.model.viewModel.record.test_type_name.toLowerCase() + 'DataModel';
              var dataModel = type.charAt( 0 ).toUpperCase() + type.substring( 1 );

              // update the data record
              $scope.model.viewModel[dataModel].viewModel.onView();

              // update the test entry record
              $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true } );
            }
          };

          $scope.isTypist = function() { return 'typist' == CnSession.role.name; };
        },
        link: function( scope, element ) {
          // close the test entry
          scope.$on( '$stateChangeStart', function() { scope.model.viewModel.close( false ); } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryViewFactory', [
    'CnBaseViewFactory',
    'CnAftDataModelFactory', 'CnMatDataModelFactory', 'CnRey1DataModelFactory', 'CnRey2DataModelFactory', 
    'CnSession', 'CnHttpFactory', '$state',
    function( CnBaseViewFactory,
              CnAftDataModelFactory, CnMatDataModelFactory, CnRey1DataModelFactory, CnRey2DataModelFactory,
              CnSession, CnHttpFactory, $state ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // add the test entry's data model
        this.AftDataModel = CnAftDataModelFactory.instance();
        this.MatDataModel = CnMatDataModelFactory.instance();
        this.Rey1DataModel = CnRey1DataModelFactory.instance();
        this.Rey2DataModel = CnRey2DataModelFactory.instance();
        this.isWorking = false;

        this.onView = function() {
          return this.$$onView().then( function() {
            if( 'typist' == CnSession.role.name ) {
              // turn off edit privilege if entry has been submitted
              self.parentModel.getEditEnabled = function() {
                return self.parentModel.$$getEditEnabled() && !self.record.submitted;
              };
            }
          } );
        };

        this.returnToTypist = function() {
          this.isWorking = true;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: { submitted: false }
          } ).patch().then( function() {
            self.record.submitted = false;
            self.isWorking = false;
          } );
        };

        this.forceSubmit = function() {
          this.isWorking = true;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: { submitted: true }
          } ).patch().then( function() {
            self.record.submitted = true;
            self.isWorking = false;
          } );
        };

        this.submit = function() {
          this.isWorking = true;
          return CnHttpFactory.instance( {
            path: this.parentModel.getServiceResourcePath(),
            data: { submitted: true }
          } ).patch().then( function() {
            self.record.submitted = true;
            self.isWorking = false;
            return self.parentModel.transitionToParentViewState( 'transcription', self.record.transcription_id );
          } );
        };

        this.close = function( transition ) {
          if( angular.isUndefined( transition ) ) transition = true;
          if( 'typist' == CnSession.role.name ) {
            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '?close=1'
            } ).patch().then( function() {
              self.record.submitted = true;
              self.isWorking = false;
              if( transition ) {
                return self.parentModel.transitionToParentViewState(
                  'transcription', self.record.transcription_id
                );
              }
            } );
          }
        };

        this.viewTranscription = function() {
          return $state.go( 'transcription.view', { identifier: this.record.transcription_id } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestEntryModelFactory', [
    'CnBaseModelFactory', 'CnTestEntryListFactory', 'CnTestEntryViewFactory',
    'CnHttpFactory', 'CnModalMessageFactory',
    function( CnBaseModelFactory, CnTestEntryListFactory, CnTestEntryViewFactory,
              CnHttpFactory, CnModalMessageFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnTestEntryListFactory.instance( this );
        this.viewModel = CnTestEntryViewFactory.instance( this, root );

        this.transitionToParentViewState = function( subject, identifier ) {
          // check if the user still has access to the transcription before proceeding
          return CnHttpFactory.instance( {
            path: subject + '/' + identifier,
            data: { select: { column: [ 'id' ] } },
            onError: function( response ) {
              // redirect to the transcription list if we get a 404
              return 403 == response.status ?
                self.transitionToParentListState( subject ) :
                CnModalMessageFactory.httpError( response );
            }
          } ).get().then( function() {
            return self.$$transitionToParentViewState( subject, identifier );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
