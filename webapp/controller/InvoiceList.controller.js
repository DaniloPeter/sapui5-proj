sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (Controller, JSONModel, formatter, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("ui5.test.controller.InvoiceList", {
      onInit() {
        // Настраиваем модель с существующими данными
        // Предполагается, что данные уже были загружены в модель
        const oModel = this.getView().getModel("invoice");

        // Проверяем наличие массива инвойсов
        if (!oModel.getProperty("/Invoices")) {
          oModel.setProperty("/Invoices", []); // Убедитесь, что массив существует
        }
      },

      onAddInvoice() {
        // Получаем модель
        const oModel = this.getView().getModel("invoice");

        // Получаем текущий массив инвойсов
        const aInvoices = oModel.getProperty("/Invoices");

        // Создаем новый объект для добавления
        const oNewInvoice = {
          taskName: "",
          taskType: "",
          responsible: "",
          startDate: this._getCurrentDate(),
          endDate: "",
        };

        // Добавляем на начало массива
        aInvoices.unshift(oNewInvoice);
        oModel.setProperty("/Invoices", aInvoices);

        console.log("Invoice added successfully.");
      },

      onFilterInvoices(oEvent) {
        // build filter array
        const aFilter = [];
        const sQuery = oEvent.getParameter("query");
        if (sQuery) {
          aFilter.push(new Filter("taskName", FilterOperator.Contains, sQuery));
        }

        // filter binding
        const oTable = this.byId("invoiceTable");
        const oBinding = oTable.getBinding("items");
        oBinding.filter(aFilter);
      },

      _getCurrentDate() {
        const oDate = new Date();
        const day = String(oDate.getDate()).padStart(2, "0");
        const month = String(oDate.getMonth() + 1).padStart(2, "0"); // Январь это 0
        const year = oDate.getFullYear();
        return `${day}.${month}.${year}`; // Формат ДД.ММ.ГГГГ
      },
    });
  }
);
