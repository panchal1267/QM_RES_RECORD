/*global location */
sap.ui.define([
	"com/sap/revgrp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"com/sap/revgrp/model/formatter"
], function(BaseController, JSONModel, MessageToast, formatter) {
	"use strict";

	return BaseController.extend("com.sap.revgrp.controller.Detail", {

		formatter: formatter,

		onInit: function() {

			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				_oResultText: ""
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		_onRouteCodeMatched: function(oEvent) {

			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("ResultCodeSet");

				this._bindView("/" + sObjectPath);
			}.bind(this));

		},

		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var sVornr = oEvent.getParameter("arguments").Vornr;
			var sAufnr = oEvent.getParameter("arguments").Aufnr;
			var sMatnr = oEvent.getParameter("arguments").Matnr;

			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("OpeninspectionlistSet", {

					Prueflos: sObjectId,
					Vornr: sVornr,
					Aufnr: sAufnr,
					Matnr: sMatnr
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// this.getView().byId("InspectionDetailList").getModel().refresh();

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

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

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Prueflos,
				sObjectName = oObject.Prueflos,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");
			//		oLineItemTable = this.byId("lineItemsList");
			//		iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			//	oLineItemTable.attachEventOnce("updateFinished", function() {
			// Restore original busy indicator delay for line item table
			//		oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			//	});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		OnSelectionChanged: function(oEvent) {

			var ochangedItem = oEvent.getParameters("selectionChange").selectedItem;
			var oChangedItemKey = ochangedItem.getKey();
			var oChangedCodeGroup = ochangedItem.getProperty("additionalText");

			//Get current Model and Object Value
			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext();
			var sPath = oContext.getPath();
			var sObject = oContext.getModel().getProperty(sPath);
			sObject.CodeResult = oChangedItemKey;
			sObject.CodeGrpResult = oChangedCodeGroup;

			this._oResultText = oItem.getValue();

			//update Context with update value
			var oModel = oContext.getModel();
			oModel.setProperty(sPath, sObject);
			// this.getView().byId("InspectionDetailList").getModel().refresh();

		},

		onListItemPressed: function(oEvent) {

			var oItem;

			oItem = oEvent.getSource();

			var sPrueflos = oItem.getBindingContext().getProperty("Prueflos");
			var sVornr = oItem.getBindingContext().getProperty("Vornr");
			var sMerknr = oItem.getBindingContext().getProperty("Merknr");
			var sAufnr = oItem.getBindingContext().getProperty("Aufnr");
			var sMatnr = oItem.getBindingContext().getProperty("Matnr");

			this.getRouter().navTo("defects", {
				Prueflos: sPrueflos,
				Vornr: sVornr,
				Merknr: sMerknr,
				Aufnr: sAufnr,
				Matnr: sMatnr
			}, true);

		},

		onSaveButtonPressed: function(oEvent) {

			var oInspectionList, i, p, oItem, sPath;
			var oCounter = 2;

			oInspectionList = this.byId("InspectionDetailList").getItems();

			for (i = 0; i < oInspectionList.length; i++) {

				sPath = oInspectionList[i].getBindingContextPath();
				oItem = oInspectionList[i].getBindingContext().getObject();

				if (oItem.CodeResult !== "9999" && oItem.CodeResult !== "") {

					// this.getModel().update(sPath, oItem,
					this.getModel().create("/InspectionDetailSet", oItem, {

						// this.getModel().update(sPath, oItem, {
						success: function() {
							MessageToast.show("Save was successful");
						},
						error: function() {
							MessageToast.show("Save was not successful");
						}

					});
				}

				// Set countet to null for recounting purpose
				var sValue = 0;

				//once success, process Defects
				for (p = 0; p < oCounter; p++) {

					var sNumber = 10;
					sValue = sValue + sNumber;
					var sFenum = "00" + sValue;

					// Build Defect Path
					var sDefectPath = "/DefectResultSet(Fenum='" + sFenum + "',Prueflos='" + oItem.Prueflos + "',Werk='" + oItem.Werk +
						"',Vornr='" + oItem.Vornr + "',Aufnr='" + oItem.Aufnr + "',Matnr='" + oItem.Matnr + "',Merknr='" + oItem.Merknr + "')";
					var oModel = oInspectionList[i].getModel();
					var oContext = oModel.getContext(sDefectPath);
					var oDataObject = oModel = oContext.getModel().getData(sDefectPath);

					// var input_data = {

					// 	"DefImage": oDataObject.DefImage,
					// 	"Fenum": oDataObject.Fenum,
					// 	"Prueflos": oDataObject.Prueflos,
					// 	"Werk": oDataObject.Werk,
					// 	"Vornr": oDataObject.Vornr,
					// 	"Aufnr": oDataObject.Aufnr,
					// 	"Matnr": oDataObject.Matnr,
					// 	"Merknr": oDataObject.Merknr,
					// 	"Pruefer": oDataObject.Pruefer,
					// 	"Maschine": oDataObject.Maschine,
					// 	"CodeResult": oDataObject.CodeResult,
					// 	"CodeGrpResult": oDataObject.CodeGrpResult,
					// 	"CodeDefect": oDataObject.CodeDefect,
					// 	"CodeGrpDefect": oDataObject.CodeGrpDefect,
					// 	"CodeDefLoc": oDataObject.CodeDefLoc,
					// 	"CodeGrpDefLoc": oDataObject.CodeGrpDefLoc,
					// 	"DefectQty": oDataObject.DefectQty
					// };

					if (oDataObject !== undefined) {

						if (oDataObject.CodeDefect !== "" && oDataObject.CodeGrpResult !== "") {

							this.getModel().create("/DefectResultSet", oDataObject, {

								success: function() {

									MessageToast.show("Save was succesful");

									//	Navigation Bak to main Page
									var oDefectItem = oEvent.getSource();
									var sPrueflos = oDefectItem.getBindingContext().getProperty("Prueflos");
									var sVornr = oDefectItem.getBindingContext().getProperty("Vornr");
									var sMerknr = oDefectItem.getBindingContext().getProperty("Merknr");
									var sAufnr = oDefectItem.getBindingContext().getProperty("Aufnr");
									var sMatnr = oDefectItem.getBindingContext().getProperty("Matnr");

									this.getRouter().navTo("masterlist", {
										Fenum: sFenum,
										Prueflos: sPrueflos,
										Vornr: sVornr,
										Merknr: sMerknr,
										Aufnr: sAufnr,
										Matnr: sMatnr
									}, true);

								},
								error: function() {
									MessageToast.show("Save was not succesful");
								},

							});

						}
					}

				}

			}

		}

	});

});