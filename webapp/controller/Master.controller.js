/*global history */
sap.ui.define([
	"com/sap/revgrp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"com/sap/revgrp/model/formatter"
], function(BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter) {
	"use strict";

	return BaseController.extend("com.sap.revgrp.controller.Master", {

		formatter: formatter,

		onInit: function() {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
		},

		onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			this.searchScanValue(sQuery);

			// if (sQuery) {
			// 	this._oListFilterState.aSearch = [new Filter("Aufnr", FilterOperator.Contains, sQuery)];
			// } else {
			// 	this._oListFilterState.aSearch = [];
			// }
			// this._applyFilterSearch();

		},

		// searchScanValue: function(sQuery) {

		// 	if (sQuery) {
		// 		this._oListFilterState.aSearch = [new Filter("Aufnr", FilterOperator.Contains, sQuery)];
		// 	} else {
		// 		this._oListFilterState.aSearch = [];
		// 	}
		// 	this._applyFilterSearch();

		// },

		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		onSelectionChange: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		onNavBack: function() {
			history.go(-1);
		},

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "Prueflos",
				groupBy: "None"
			});
		},

		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("Prueflos");
					var sVornr = mParams.firstListitem.getBindingContext().getProperty("Vornr");
					var sAufnr = mParams.firstListitem.getBindingContext().getProperty("Aufnr");
					var sMatnr = mParams.firstListitem.getBindingContext().getProperty("Matnr");
					this.getRouter().navTo("object", {
						objectId: sObjectId,
						Vornr: sVornr,
						Aufnr: sAufnr,
						Matnr: sMatnr
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},

		onFacetFilterOrderOpen: function(oEvent) {
			var oServiceUrl = this.getView().getModel().sServiceUrl;
			var oDataModel = new sap.ui.model.odata.ODataModel(oServiceUrl, true);

			if (!this.oFilterOrders) {
				this.oFilterOrders = this.getView().byId("BlockingOrdersFilter");
				this.setModel(oDataModel);
			}

		},

		onFacetFilterWrkcentOpen: function(oEvent) {

			var oServiceUrl = this.getView().getModel().sServiceUrl;
			var oDataModel = new sap.ui.model.odata.ODataModel(oServiceUrl, true);

			if (!this.oFilterOrders) {
				this.oFilterOrders = this.getView().byId("BlockingWorkCenterFilter");
				this.setModel(oDataModel);
			}

		},

		onFacetFilterMatnrOpen: function(oEvent) {

			var oServiceUrl = this.getView().getModel().sServiceUrl;
			var oDataModel = new sap.ui.model.odata.ODataModel(oServiceUrl, true);

			if (!this.oFilterOrders) {
				this.oFilterOrders = this.getView().byId("BlockingMaterialFilter");
				this.setModel(oDataModel);
			}

		},

		onFacetFilterBatchnrOpen: function(oEvent) {

			var oServiceUrl = this.getView().getModel().sServiceUrl;
			var oDataModel = new sap.ui.model.odata.ODataModel(oServiceUrl, true);

			if (!this.oFilterOrders) {
				this.oFilterOrders = this.getView().byId("BlockingBatchFilter");
				this.setModel(oDataModel);
			}

		},

		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;

			var sObjectId = oItem.getBindingContext().getProperty("Prueflos");
			var sVornr = oItem.getBindingContext().getProperty("Vornr");
			var sAufnr = oItem.getBindingContext().getProperty("Aufnr");
			var sMatnr = oItem.getBindingContext().getProperty("Matnr");

			this.getRouter().navTo("object", {
				objectId: sObjectId,
				Vornr: sVornr,
				Aufnr: sAufnr,
				Matnr: sMatnr
			}, bReplace);
		},

		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},

		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		ScanBarcode: function(oEvent) {

			jQuery.sap.require("sap.ndc.BarcodeScanner");

            var oSearchField = this.getView().byId("searchField");
			var oCurrent = this;

		
			sap.ndc.BarcodeScanner.scan(

				function(oResult) {

					// / * process scan result * /
					sap.m.MessageToast.show(oResult.text);
					oSearchField.setValue(oResult.text);
					// this.searchScanValue(oResult.text);
					oCurrent.searchScanValue(oResult.text);

				},

				function(oError) {
					// / * handle scan error * /
					sap.m.MessageToast.show("Scanner not available");

				},

				function(oResult) {

					// / * process scan result * /
					sap.m.MessageToast.show(oResult.text);
					oSearchField.setValue(oResult.text);
					oCurrent.searchScanValue(oResult.text);

				});

		},

		searchScanValue: function(sQuery) {

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Aufnr", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		}

	});

});