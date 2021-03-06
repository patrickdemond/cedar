define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'special_letter', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'special letter',
      plural: 'special letters',
      possessive: 'special letter\'s'
    },
    columnList: {
      language: {
        column: 'language.name',
        title: 'Language'
      },
      letter: {
        title: 'Letter'
      }
    },
    defaultOrder: {
      column: 'special_letter.letter',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    language: {
      column: 'language.name',
      title: 'Language',
      type: 'string',
      isConstant: true
    },
    letter: {
      title: 'Letter',
      type: 'string',
      isConstant: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSpecialLetterAdd', [
    'CnSpecialLetterModelFactory',
    function( CnSpecialLetterModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSpecialLetterModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSpecialLetterList', [
    'CnSpecialLetterModelFactory',
    function( CnSpecialLetterModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSpecialLetterModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSpecialLetterView', [
    'CnSpecialLetterModelFactory',
    function( CnSpecialLetterModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSpecialLetterModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSpecialLetterAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSpecialLetterListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSpecialLetterViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSpecialLetterModelFactory', [
    'CnBaseModelFactory',
    'CnSpecialLetterAddFactory', 'CnSpecialLetterListFactory', 'CnSpecialLetterViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory,
              CnSpecialLetterAddFactory, CnSpecialLetterListFactory, CnSpecialLetterViewFactory, CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSpecialLetterAddFactory.instance( this );
        this.listModel = CnSpecialLetterListFactory.instance( this );
        this.viewModel = CnSpecialLetterViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
