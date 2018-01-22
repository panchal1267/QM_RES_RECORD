/*global location */
sap.ui.define([
	"com/sap/revgrp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/sap/revgrp/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History"

], function(BaseController, JSONModel, formatter, MessageToast, History) {
	"use strict";

	return BaseController.extend("com.sap.revgrp.controller.Defectlist", {
		formatter: formatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.sap.revgrp.view.Defectlist
		 */
		onInit: function() {

			var oViewModel = new JSONModel();
			var oRouter = this.getRouter();

			oRouter.getRoute("defects").attachPatternMatched(this._onRouteMatched, this);

			this.setModel(oViewModel, "defectlistView");

			// Defect Model Copy
			this.oDefectslistModel = new JSONModel();
			this.getView().setModel(this.oDefectslistModel, "DefectlistData");

		},

		_onRouteMatched: function(oEvent) {

			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();

			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("InspectionDetailSet", {

					Prueflos: oArgs.Prueflos,
					Vornr: oArgs.Vornr,
					Merknr: oArgs.Merknr,
					Aufnr: oArgs.Aufnr,
					Matnr: oArgs.Matnr
				});

				this._bindView("/" + sObjectPath);

			}.bind(this));
		},

		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("defectlistView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			var oDefectlistData = this.getView().getModel("DefectlistData");
			var oDefectlistpath = sObjectPath + "/DefectResult";
			oDefectlistData.setData({
				path: oDefectlistpath
			});

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
		},

		onNavBack: function(oEvent) {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {

				var oItem;

				oItem = oEvent.getSource();

				var sPrueflos = oItem.getBindingContext().getProperty("Prueflos");
				var sVornr = oItem.getBindingContext().getProperty("Vornr");
				var sAufnr = oItem.getBindingContext().getProperty("Aufnr");
				var sMatnr = oItem.getBindingContext().getProperty("Matnr");

				this.getRouter().navTo("masterlist", {
					Prueflos: sPrueflos,
					Vornr: sVornr,
					Aufnr: sAufnr,
					Matnr: sMatnr
				}, true);

			}
		},

		onDefectListItemClicked: function(oEvent) {

			var oItem;

			oItem = oEvent.getSource();

			var sFenum = oItem.getBindingContext().getProperty("Fenum");
			var sPrueflos = oItem.getBindingContext().getProperty("Prueflos");
			var sWerk = oItem.getBindingContext().getProperty("Werk");
			var sVornr = oItem.getBindingContext().getProperty("Vornr");
			var sAufnr = oItem.getBindingContext().getProperty("Aufnr");
			var sMatnr = oItem.getBindingContext().getProperty("Matnr");
			var sMerknr = oItem.getBindingContext().getProperty("Merknr");

			this.getRouter().navTo("addDefect", {
				Fenum: sFenum,
				Prueflos: sPrueflos,
				Werk: sWerk,
				Vornr: sVornr,
				Aufnr: sAufnr,
				Matnr: sMatnr,
				Merknr: sMerknr
			}, true);
		},

		onSaveButtonPressed: function(oEvent) {

			var i, oItem, sPath, oHistory, sPreviousHash;

			// Get Record Value

			var oDefectItem = oEvent.getSource();
			var oRouter = this.getRouter();

			// get the result Value
			var oContext = this.getView().getBindingContext();
			var oModel = oContext.getModel();
			var oContextPath = oContext.getPath();
			var oData = oModel.getData(oContextPath);

			// Send Defects to Backend
			var olineItemsList = this.byId("lineItemsList").getItems();

			for (i = 0; i < olineItemsList.length; i++) {

				sPath = olineItemsList[i].getBindingContextPath();
				oItem = olineItemsList[i].getBindingContext().getObject();

				// Pass Result Value
				oItem.CodeGrpResult = oData.CodeGrpResult;
				oItem.CodeResult = oData.CodeResult;

				if (oItem.CodeDefLoc !== "" && oItem.CodeDefect !== "" && oItem.CodeGrpDefLoc !== "" && oItem.CodeGrpDefect !== "" && oItem.CodeGrpResult !==
					"" && oItem.CodeResult !== "" && oItem.DefectQty !== "" && oItem.Maschine !== "") {

					this.getModel().create("/DefectResultSet", oItem, {

						success: function() {

							MessageToast.show("Save was succesful");

							//	Navigation Back to main Page

							var sPrueflos = oDefectItem.getBindingContext().getProperty("Prueflos");
							var sVornr = oDefectItem.getBindingContext().getProperty("Vornr");
							var sAufnr = oDefectItem.getBindingContext().getProperty("Aufnr");
							var sMatnr = oDefectItem.getBindingContext().getProperty("Matnr");

							oRouter.navTo("masterlist", {

								Prueflos: sPrueflos,
								Vornr: sVornr,
								Aufnr: sAufnr,
								Matnr: sMatnr
							}, true);

							// 		// }
						},
						error: function() {
							MessageToast.show("Save was not succesful");
						},

					});

				}
			}

		
		}

	});

});