define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'REY' );
  module.addInputGroup( '', { value: { type: 'boolean' } } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataView', [
    'CnReyDataModelFactory',
    function( CnReyDataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnPrematDataModelFactory.root;
          $scope.isComplete = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );
        }   
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataModelFactory', [
    'CnBaseDataModelFactory', 'CnReyDataViewFactory',
    function( CnBaseDataModelFactory, CnReyDataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnReyDataViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
