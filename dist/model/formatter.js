sap.ui.define([
	"com/sap/revgrp/model/formatter",
	"sap/ui/core/format/DateFormat"
], function(formatter, DateFormat) {
	"use strict";

	return {

		date: function(value) {

			if (value) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					
					style: "medium"
				});
				return oDateFormat.format(new Date(value));
			} else {
				return value;
			}
		},

		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		}
	};

});