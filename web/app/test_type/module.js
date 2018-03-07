define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'test_type', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'test type',
      plural: 'test types',
      possessive: 'test type\'s'
    },
    columnList: {
      rank: { title: 'Rank' },
      name: { title: 'Name' },
      data_type: { title: 'Data Type' },
      average_score: { title: 'Average Score' },
      average_alt_score: { title: 'Average Alt Score' }
    },
    defaultOrder: {
      column: 'test_type.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    rank: {
      title: 'Rank',
      type: 'string'
    },
    name: {
      title: 'Name',
      type: 'string'
    },
    data_type: {
      title: 'Data Type',
      type: 'string'
    },
    average_score: {
      title: 'Average Score',
      type: 'string',
      constant: true
    },
    average_alt_score: {
      title: 'Average Alternate Score',
      type: 'string',
      constant: true
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  module.addExtraOperation( 'list', {
    title: 'Rescore All Test Entries',
    isIncluded: function( $state, model ) { return model.canRescoreTestEntries(); },
    operation: function( $state, model ) {
      model.listModel.rescoreTestEntries().then( function( response ) {
        if( angular.isDefined( response ) ) model.listModel.onList( true );
      } );
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Rescore Test Entries',
    isIncluded: function( $state, model ) { return model.canRescoreTestEntries(); },
    operation: function( $state, model ) {
      model.viewModel.rescoreTestEntries().then( function( response ) {
        if( angular.isDefined( response ) ) model.viewModel.onView();
      } );
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestTypeList', [
    'CnTestTypeModelFactory',
    function( CnTestTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTestTypeView', [
    'CnTestTypeModelFactory',
    function( CnTestTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTestTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeListFactory', [
    'CnBaseListFactory', 'CnHttpFactory', 'CnModalConfirmFactory',
    function( CnBaseListFactory, CnHttpFactory, CnModalConfirmFactory ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseListFactory.construct( this, parentModel );

        this.rescoreTestEntries = function() {
          return CnModalConfirmFactory.instance( {
            title: 'Re-Score All Test Entries',
            message: 'Are you sure you wish to re-score all test entries?\n\n' +
                     'This process is processor-intensive and may slow down the application for all ' +
                     'users while scores are being re-calculated.  You should only continue if it is ' +
                     'necessary for tests to be re-scored immediately.'
          } ).show().then( function( response ) {
            if( response ) return CnHttpFactory.instance( { path: 'test_type?rescore=1' } ).count();
          } );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory', 'CnModalConfirmFactory',
    function( CnBaseViewFactory, CnHttpFactory, CnModalConfirmFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        this.rescoreTestEntries = function() {
          return CnModalConfirmFactory.instance( {
            title: 'Re-Score ' + self.record.data_type.toUpperCase() + ' Test Entries',
            message: 'Are you sure you wish to re-score all ' + self.record.name + ' test entries?\n\n' +
                     'This process is processor-intensive and may slow down the application for all ' +
                     'users while scores are being re-calculated.  You should only continue if it is ' +
                     'necessary for ' + self.record.name + ' tests to be re-scored immediately.'
          } ).show().then( function( response ) {
            if( response ) return CnHttpFactory.instance( {
              path: 'test_type/' + self.record.id + '?rescore=1'
            } ).get();
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTestTypeModelFactory', [
    'CnBaseModelFactory', 'CnTestTypeListFactory', 'CnTestTypeViewFactory', 'CnSession',
    function( CnBaseModelFactory, CnTestTypeListFactory, CnTestTypeViewFactory, CnSession ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnTestTypeListFactory.instance( this );
        this.viewModel = CnTestTypeViewFactory.instance( this, root );

        this.canRescoreTestEntries = function() { return 2 < CnSession.role.tier; };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
