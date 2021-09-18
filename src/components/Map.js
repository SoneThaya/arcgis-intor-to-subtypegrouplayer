import React, { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";

const Map = () => {
  const MapEl = useRef(null);

  useEffect(() => {
    loadModules([
      "esri/Map",
      "esri/views/MapView",
      "esri/layers/SubtypeGroupLayer",
      "esri/layers/support/LabelClass",
      "esri/widgets/LayerList",
    ]).then(([Map, MapView, SubtypeGroupLayer, LabelClass, LayerList]) => {
      let defaultRenderer;

      // configuring the labels with the LabelClass
      const labelClass = new LabelClass({
        minScale: 0,
        maxScale: 25.5,
        symbol: {
          type: "text", // autocasts as new TextSymbol()
          color: "black",
          haloColor: "white",
          haloSize: 1.5,
          font: {
            // autocast as new Font()
            family: "Noto Sans",
            size: 10,
          },
        },
        labelPlacement: "above-center",
        labelExpression: "[assetgroup]",
      });

      // creating the PopupTemplate
      const popupTemplate = {
        title: "SubtypeCode: {assetgroup}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "assettype",
                label: "asset type",
              },
              {
                fieldName: "transformer_kva",
                label: "transformer kva",
              },
              {
                fieldName: "subnetworkname",
                label: "submetwork name",
              },
            ],
          },
        ],
      };

      // creating a SimpleRenderer
      const simpleRenderer = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          style: "circle",
          color: "#CC99FF",
          size: 9,
          outline: {
            color: "#000000",
            width: 1,
          },
        },
      };

      // creating a ClassBreaksRenderer
      const classBreaksRenderer = {
        type: "class-breaks", // autocasts as a new ClassBreaksRenderer()
        field: "objectid", // field of interest
        classBreakInfos: [
          {
            // all features with objectid between 0 - 2000
            minValue: 0,
            maxValue: 2000,
            symbol: {
              type: "simple-marker",
              style: "circle",
              color: "#F4A896",
              size: 9,
              outline: {
                color: "black",
                width: 1,
              },
            },
          },
          {
            // all features with objectid between 2001 - 4000
            minValue: 2001,
            maxValue: 4000,
            symbol: {
              type: "simple-marker",
              style: "circle",
              color: "#358597",
              size: 9,
              outline: {
                color: "black",
                width: 1,
              },
            },
          },
          {
            // all features with objectid greater than 4000
            minValue: 4001,
            symbol: {
              type: "simple-marker",
              style: "circle",
              color: "red",
              size: 9,
              outline: {
                color: "black",
                width: 1,
              },
            },
          },
        ],
      };

      const map = new Map({
        basemap: "streets-night-vector",
      });

      const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 17,
        center: [-88.15, 41.787],
      });

      // initializing a SubtypeGroupLayer
      // creating the SubtypeGroupLayer from a feature service url will also work
      const stgl = new SubtypeGroupLayer({
        portalItem: {
          // autocasts as new PortalItem()
          id: "b702d7258a724a53aada3fefc3a36829",
        },
        outFields: [
          "assettype",
          "assetgroup",
          "objectid",
          "transformer_kva",
          "subnetworkname",
        ],
      });

      map.add(stgl);

      view.when(() => {
        let index = 0; // tracking index of the layer items

        // initializing the LayerList widget
        const layerList = new LayerList({
          view: view,
          listItemCreatedFunction(event) {
            // this executes for each ListItem in the LayerList
            if (event.item.layer.type === "subtype-sublayer") {
              // set the layer properties and UI for each sublayer
              setLayerListActions(event.item, index++);
            }
          },
        });

        // add the widget to the view
        view.ui.add(layerList, "top-right");
      });

      // set the sublayer properties and
      // create the UI for the LayerList actions
      function setLayerListActions(item, index) {
        // set labels for each sublayer
        item.layer.labelingInfo = [labelClass];
        item.layer.labelsVisible = false;

        // set a PopupTemplate for each sublayer
        item.layer.popupTemplate = popupTemplate;

        // creating the LayerList actions UI
        const blockDiv = document.createElement("div");
        blockDiv.classList.add("btn-group");

        // create a labels toggle button
        const labelsBtn = document.createElement("button");
        labelsBtn.innerText = "Labels";
        labelsBtn.onclick = () => {
          setLabels(item.layer, labelsBtn);
        };
        blockDiv.appendChild(labelsBtn);

        // create renderer toggle button
        const rendererBtn = document.createElement("button");
        setBtnUI(rendererBtn, "simple", "#000000", "#CC99FF");
        rendererBtn.onclick = () => {
          setRenderer(item.layer, rendererBtn);
        };
        blockDiv.appendChild(rendererBtn);

        // set layerlist actions
        item.panel = {
          content: blockDiv,
          className: "esri-icon-settings",
        };
        // setting the first sublayer action panel
        // as open by default
        if (index === 0) {
          item.panel.open = true;
          defaultRenderer = item.layer.renderer;
        }
      }

      // handles the labels toggle logic
      function setLabels(sublayer, btn) {
        sublayer.labelsVisible = !sublayer.labelsVisible;
        sublayer.labelsVisible
          ? (btn.style.backgroundColor = "#007AC2")
          : (btn.style.backgroundColor = "#EFEFEF");
        sublayer.labelsVisible
          ? (btn.style.color = "#FFFFFF")
          : (btn.style.color = "#000000");
      }

      // handles the renderer toggle logic
      function setRenderer(sublayer, btn) {
        // if using simple renderer then set the next
        // renderer as class-breaks
        if (sublayer.renderer.type === "simple") {
          sublayer.renderer = classBreaksRenderer;
          setBtnUI(btn, "unique-value", "#000000", "#F4A896");
        }
        // if using class-breaks, the next renderer is
        // unique-value - sublayer's default renderer is unique-value
        else if (sublayer.renderer.type === "class-breaks") {
          sublayer.renderer = defaultRenderer;
          setBtnUI(btn, "simple", "#000000", "#CC99FF");
        }
        // if using unique-value renderer then set the next
        // renderer to a simple renderer
        else if (sublayer.renderer.type === "unique-value") {
          sublayer.renderer = simpleRenderer;
          setBtnUI(btn, "class-breaks", "#FFFFFF", "#358597");
        }
      }

      // handles toggling the btn ui
      function setBtnUI(btn, text, color, backgroundColor) {
        btn.innerText = text;
        btn.style.color = color;
        btn.style.backgroundColor = backgroundColor;
      }
    });
  }, []);

  return (
    <div
      id="viewDiv"
      style={{ height: "100vh", width: "100vw" }}
      ref={MapEl}
    ></div>
  );
};

export default Map;
