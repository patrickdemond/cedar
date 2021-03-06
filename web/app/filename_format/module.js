define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'filename_format', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_type',
        column: 'test_type.name'
      }
    },
    name: {
      singular: 'filename format',
      plural: 'filename formats',
      possessive: 'filename format\'s'
    },
    columnList: {
      format: { title: 'Format' },
    },
    defaultOrder: {
      column: 'filename_format.format',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    format: {
      title: 'Format',
      type: 'string',
      help: 'A regular expression used to match recording filenames to the parent test type.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFilenameFormatAdd', [
    'CnFilenameFormatModelFactory',
    function( CnFilenameFormatModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFilenameFormatModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFilenameFormatList', [
    'CnFilenameFormatModelFactory',
    function( CnFilenameFormatModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFilenameFormatModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFilenameFormatView', [
    'CnFilenameFormatModelFactory',
    function( CnFilenameFormatModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFilenameFormatModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFilenameFormatAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFilenameFormatListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFilenameFormatViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFilenameFormatModelFactory', [
    'CnBaseModelFactory',
    'CnFilenameFormatAddFactory',
    'CnFilenameFormatListFactory',
    'CnFilenameFormatViewFactory',
    function( CnBaseModelFactory,
              CnFilenameFormatAddFactory,
              CnFilenameFormatListFactory,
              CnFilenameFormatViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnFilenameFormatAddFactory.instance( this );
        this.listModel = CnFilenameFormatListFactory.instance( this );
        this.viewModel = CnFilenameFormatViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
