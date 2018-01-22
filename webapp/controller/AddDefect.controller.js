sap.ui.define([
	"com/sap/revgrp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/UploadCollectionParameter",
	"com/sap/revgrp/model/formatter",
	"sap/ui/core/routing/History"

], function(BaseController, JSONModel, MessageToast, UploadCollectionParameter, formatter, History) {
	"use strict";

	return BaseController.extend("com.sap.revgrp.controller.AddDefect", {
		formatter: formatter,

		onInit: function() {

			var oViewAddDefectModel = new JSONModel();
			var oRouter = this.getRouter();

			oRouter.getRoute("addDefect").attachPatternMatched(this._onRouteMatched, this);
			// this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			// this._oRouter.attachRouteMatched(this._onRouteMatched, this);

			this.setModel(oViewAddDefectModel, "AddDefectContainer");

			// Defect Model Copy
			this.oAddedDefectsModel = new JSONModel();
			this.getView().setModel(this.oAddedDefectsModel, "addDefectData");

			// Set Initial Value
			this.oDefectCodeSet = this.byId("DefectCodeSet");
			this.DefectLocCodeSet = this.byId("DefectLocCodeSet");
			this.oUploadItems = new sap.m.UploadCollection();

		},

		_onRouteMatched: function(oEvent) {

			var oArgs, oView;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();

			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("DefectResultSet", {

					Fenum: oArgs.Fenum,
					Prueflos: oArgs.Prueflos,
					Werk: oArgs.Werk,
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
			var oViewModel = this.getModel("AddDefectContainer");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			// oViewModel.setProperty("/busy", false);

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

			var oObject = this.getView().getElementBinding().getBoundContext().getObject();
			var oElementBinding = this.getView().getElementBinding();
			var sPath = oElementBinding.getBoundContext().getPath();

			var oAddedDefect = this.getView().getModel("addDefectData");
			var oDefectObject = oAddedDefect.getObject(sPath);
			// need to add 
			if (oDefectObject === undefined) {
				// update DefectCodeSet
				var oDefCodeSet = this.oDefectCodeSet.getValue();
				if (oDefCodeSet !== "") {
					this.oDefectCodeSet.setValue("");
				}

				var oDefLocCodeSet = this.DefectLocCodeSet.getValue();
				if (oDefLocCodeSet !== "") {
					this.DefectLocCodeSet.setValue("");
				}

				oAddedDefect.setProperty(sPath, oObject);
			}

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
		},
		OnSelectionLocationChanged: function(oEvent) {

			var ochangedItem = oEvent.getParameters("selectionChange").selectedItem;
			var oChangedItemKey = ochangedItem.getKey();
			var oChangedCodeGroup = ochangedItem.getProperty("additionalText");

			//Get current Model and Object Value
			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext();
			var sPath = oContext.getPath();
			var sObject = oContext.getModel().getProperty(sPath);
			sObject.CodeDefLoc = oChangedItemKey;
			sObject.CodeGrpDefLoc = oChangedCodeGroup;

			//update Context with update value
			var oModel = oContext.getModel();
			oModel.setProperty(sPath, sObject);
		},

		OnSelectionDefectChanged: function(oEvent) {

			var ochangedItem = oEvent.getParameters("selectionChange").selectedItem;
			var oChangedItemKey = ochangedItem.getKey();
			var oChangedCodeGroup = ochangedItem.getProperty("additionalText");

			//Get current Model and Object Value
			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext();
			var sPath = oContext.getPath();
			var sObject = oContext.getModel().getProperty(sPath);
			sObject.CodeDefect = oChangedItemKey;
			sObject.CodeGrpDefect = oChangedCodeGroup;

			//update Context with update value
			var oModel = oContext.getModel();
			oModel.setProperty(sPath, sObject);
		},

		onUploadComplete: function(oEvent) {

			var Attach = {};
			//var oUploadItems = new sap.m.UploadCollection();
			// var oUploadItem = new sap.m.UploadCollectionItem();
			var oView = this.getView().byId("UploadCollection");
			var oContext = oView.getBindingContext();
			var oModel = oContext.getModel();
			var sPath = oContext.getPath();
			var sObject = oContext.getObject(sPath);

			// Get File Name
			var sUploadfile = oEvent.getParameter("files")[0];
			var sFilename = sUploadfile.fileName;

			Attach = {
				"Prueflos": sObject.Prueflos,
				"Werk": sObject.Werk,
				"Vornr": sObject.Vornr,
				"Fenum": sObject.Fenum,
				"Aufnr": sObject.Aufnr,
				"Matnr": sObject.Matnr,
				"Merknr": sObject.Merknr,
				"Mimetype": "",
				"Content": sFilename

			};

			//sObject.Attachment = Attach;
			//oModel.setProperty(sPath, sObject);

		},

		onStartUpload: function(oEvent) {

			var oUploadCollection = this.getView().byId("UploadCollection");
			var oFiles = oUploadCollection.getItems().length;
			var uploadInfo = "";

			oUploadCollection.upload();

			uploadInfo = oFiles + " file(s)";

			MessageToast.show("Method Upload is called (" + uploadInfo + ")");
			sap.m.MessageBox.information("Uploaded " + uploadInfo);

		},

		onTypeMissmatch: function(oEvent) {

			var aFileTypes = oEvent.getSource().getFileType();
			jQuery.each(aFileTypes, function(key, value) {
				aFileTypes[key] = "*." + value;
			});

			var sSupportedFileTypes = aFileTypes.join(", ");

			MessageToast.show("The file type *." + oEvent.getParameter("fileType") + " is not supported. Choose one of the types:" +
				sSupportedFileTypes);
		},

		onBeforeUploadStarts: function(oEvent) {

			// Header Slug
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

		},

		onChange: function(oEvent) {

			var oView = this.getView().byId("UploadCollection");
			var oModel = oView.getModel();

			var UploadUrl = oEvent.getSource().getUploadUrl();
			oModel._UploadUrl = UploadUrl;

			// Get CRSF Token
			sap.ui.getCore().setModel(oModel);
			var oRequest = sap.ui.getCore().getModel().getSecurityToken();

			var oUploadCollection = oEvent.getSource();

			// Header Token 
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: oRequest
			});

			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

		},

		onNavBack: function(oEvent) {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				// this.getRouter().navTo("master", {}, true);
				var oItem;

				oItem = oEvent.getSource();

				var sPrueflos = oItem.getBindingContext().getProperty("Prueflos");
				var sVornr = oItem.getBindingContext().getProperty("Vornr");
				var sMerknr = oItem.getBindingContext().getProperty("Merknr");
				var sAufnr = oItem.getBindingContext().getProperty("Aufnr");
				var sMatnr = oItem.getBindingContext().getProperty("Matnr");
				var sFenum = oItem.getBindingContext().getProperty("Fenum");

				this.getRouter().navTo("defects", {
					Fenum: sFenum,
					Prueflos: sPrueflos,
					Vornr: sVornr,
					Merknr: sMerknr,
					Aufnr: sAufnr,
					Matnr: sMatnr
				}, true);

			}
		},

		buildFileDescriptorObject: function(v) {

			var ofileUploader = this.getView().byId("fileuploader");
			var oDomRef = ofileUploader.getFocusDomRef();
			var sfile = oDomRef.files[0];

			var d = new Date();

		},

		onSaveDefectButtonPressed: function(oEvent) {

			// Collect Attachments

			var i;

			var sQuantity = this.getView().byId("Quantity").getValue();
			var sMaschine = this.getView().byId("Comments").getValue();

			// Upadte current Model and Object Value
			var oDefectItem = oEvent.getSource();
			var oDefectContext = oDefectItem.getBindingContext();
			var sDefectPath = oDefectContext.getPath();
			var sDefectObject = oDefectContext.getModel().getProperty(sDefectPath);
			sDefectObject.DefectQty = sQuantity;
			sDefectObject.Maschine = sMaschine;

			//update Context with update value
			var oContext = this.getView().getBindingContext();
			var oModel = oContext.getModel();
			oModel.setProperty(sDefectPath, sDefectObject);

			// Once Data has been updated, navigate to previous screen

			var sPrueflos = oDefectItem.getBindingContext().getProperty("Prueflos");
			var sVornr = oDefectItem.getBindingContext().getProperty("Vornr");
			var sMerknr = oDefectItem.getBindingContext().getProperty("Merknr");
			var sAufnr = oDefectItem.getBindingContext().getProperty("Aufnr");
			var sMatnr = oDefectItem.getBindingContext().getProperty("Matnr");
			var sFenum = oDefectItem.getBindingContext().getProperty("Fenum");

			// var oDefectCodeComboBox = this.getView().byId("DefectCodeSet");
			// oDefectCodeComboBox.setValue("");

			// var oDefectLocComboBox = this.getView().byId("DefectLocCodeSet");
			// oDefectLocComboBox.setValue("");

			this.getRouter().navTo("defects", {
				Fenum: sFenum,
				Prueflos: sPrueflos,
				Vornr: sVornr,
				Merknr: sMerknr,
				Aufnr: sAufnr,
				Matnr: sMatnr
			}, true);

		}

	});
});