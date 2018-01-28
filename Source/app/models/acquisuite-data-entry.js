var mongoose = require('mongoose');
var acquisuiteDataSchema = mongoose.Schema({
    Total_Net_Instantaneous : {
            real_power            : String,
            reactive_power        : String,
            apparant_power        : String
    },
    block            : [{
        name         : String,
        building     : [{type:mongoose.Schema.ObjectId, ref: 'Building'}],
        chart        : String,
        variable     : String
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('DataEntry', acquisuiteDataSchema);


<point number="0" name="Accumulated Real Energy Net" units="kWh" value="8992928.00" />
    <point number="1" name="Real Energy Quadrants 1 &amp; 4, Import" units="kWh" value="8992943.00" />
    <point number="2" name="Real Energy Quadrants 2 &amp; 3, Export" units="kWh" value="15.25" />
    <point number="3" name="Reactive Energy Quadrant 1" units="VARh" value="3347863.75" />
    <point number="4" name="Reactive Energy Quadrant 2" units="VARh" value="73.51" />
    <point number="5" name="Reactive Energy Quadrant 3" units="VARh" value="74.61" />
    <point number="6" name="Reactive Energy Quadrant 4" units="VARh" value="73.57" />
    <point number="7" name="Apparent Energy Net" units="VAh" value="9615924.00" />
    <point number="8" name="Apparent Energy Quadrants 1 &amp; 4" units="VAh" value="9616068.00" />
    <point number="9" name="Apparent Energy Quadrants 2 &amp; 3" units="VAh" value="144.20" />
    <point number="10" name="Total Net Instantaneous Real Power" units="kW" value="341.89" />
    <point number="11" name="Total Net Instantaneous Reactive Power" units="kVAR" value="111.93" />
    <point number="12" name="Total Net Instantaneous Apparent Power" units="kVA" value="359.74" />
    <point number="13" name="Total Power Factor" units="" value="0.95" />
    <point number="14" name="Voltage, L-L, 3p Ave" units="Volts" value="486.66" />
    <point number="15" name="Voltage, L-N, 3p Ave" units="Volts" value="280.89" />
    <point number="16" name="Current, 3p Ave" units="Amps" value="421.66" />
    <point number="17" name="Frequency" units="Hz" value="60.02" />
    <point number="18" name="Total Real Power Present Demand" units="kW" value="351.72" />
    <point number="19" name="Total Reactive Power Present Demand" units="kVAR" value="109.71" />
    <point number="20" name="Total Apparent Power Present Demand" units="kVA" value="368.85" />
    <point number="21" name="Total Real Power Max Demand, Import" units="kW" value="756.22" />
    <point number="22" name="Total Reactive Power Max Demand, Import" units="kVAR" value="240.72" />
    <point number="23" name="Total Apparent Power Max Demand, Import" units="kVA" value="792.54" />
    <point number="24" name="Total Real Power Max Demand, Export" units="kW" value="-0.08" />
    <point number="25" name="Total Reactive Power Max Demand, Export" units="kVAR" value="-1.80" />
    <point number="26" name="Total Apparent Power Max Demand, Export" units="kVA" value="266.28" />
    <point number="27" name="Accumulated Real Energy, Phase A, Import" units="kWh" value="2945796.75" />
    <point number="28" name="Accumulated Real Energy, Phase B, Import" units="kWh" value="3164250.25" />
    <point number="29" name="Accumulated Real Energy, Phase C, Import" units="kWh" value="2882895.50" />
    <point number="30" name="Accumulated Real Energy, Phase A, Export" units="kWh" value="5.05" />
    <point number="31" name="Accumulated Real Energy, Phase B, Export" units="kWh" value="5.29" />
    <point number="32" name="Accumulated Real Energy, Phase C, Export" units="kWh" value="4.92" />
    <point number="33" name="Accumulated Q1 Reactive Energy, Phase A, Import" units="VARh" value="1226261.38" />
    <point number="34" name="Accumulated Q1 Reactive Energy, Phase B, Import" units="VARh" value="968711.19" />
    <point number="35" name="Accumulated Q1 Reactive Energy, Phase C, Import" units="VARh" value="1152890.88" />
    <point number="36" name="Accumulated Q2 Reactive Energy, Phase A, Import" units="VARh" value="24.21" />
    <point number="37" name="Accumulated Q2 Reactive Energy, Phase B, Import" units="VARh" value="25.49" />
    <point number="38" name="Accumulated Q2 Reactive Energy, Phase C, Import" units="VARh" value="23.82" />
    <point number="39" name="Accumulated Q3 Reactive Energy, Phase A, Export" units="VARh" value="24.72" />
    <point number="40" name="Accumulated Q3 Reactive Energy, Phase B, Export" units="VARh" value="26.01" />
    <point number="41" name="Accumulated Q3 Reactive Energy, Phase C, Export" units="VARh" value="23.88" />
    <point number="42" name="Accumulated Q4 Reactive Energy, Phase A, Export" units="VARh" value="24.54" />
    <point number="43" name="Accumulated Q4 Reactive Energy, Phase B, Export" units="VARh" value="25.59" />
    <point number="44" name="Accumulated Q4 Reactive Energy, Phase C, Export" units="VARh" value="23.44" />
    <point number="45" name="Accumulated Apparent Energy, Phase A, Import" units="VAh" value="3197485.75" />
    <point number="46" name="Accumulated Apparent Energy, Phase B, Import" units="VAh" value="3316128.50" />
    <point number="47" name="Accumulated Apparent Energy, Phase C, Import" units="VAh" value="3112389.00" />
    <point number="48" name="Accumulated Apparent Energy, Phase A, Export" units="VAh" value="49.43" />
    <point number="49" name="Accumulated Apparent Energy, Phase B, Export" units="VAh" value="52.02" />
    <point number="50" name="Accumulated Apparent Energy, Phase C, Export" units="VAh" value="48.18" />
    <point number="51" name="Real Power, Phase A" units="kW" value="115.51" />
    <point number="52" name="Real Power, Phase B" units="kW" value="119.45" />
    <point number="53" name="Real Power, Phase C" units="kW" value="106.92" />
    <point number="54" name="Reactive Power, Phase A" units="kVAR" value="40.12" />
    <point number="55" name="Reactive Power, Phase B" units="kVAR" value="31.53" />
    <point number="56" name="Reactive Power, Phase C" units="kVAR" value="40.27" />
    <point number="57" name="Apparent Power, Phase A" units="kVA" value="122.22" />
    <point number="58" name="Apparent Power, Phase B" units="kVA" value="123.49" />
    <point number="59" name="Apparent Power, Phase C" units="kVA" value="114.20" />
    <point number="60" name="Power Factor, Phase A" units="" value="0.95" />
    <point number="61" name="Power Factor, Phase B" units="" value="0.97" />
    <point number="62" name="Power Factor, Phase C" units="" value="0.94" />
    <point number="63" name="Voltage, Phase A-B" units="Volts" value="485.50" />
    <point number="64" name="Voltage, Phase B-C" units="Volts" value="488.30" />
    <point number="65" name="Voltage, Phase A-C" units="Volts" value="486.18" />
    <point number="66" name="Voltage, Phase A-N" units="Volts" value="279.62" />
    <point number="67" name="Voltage, Phase B-N" units="Volts" value="280.54" />
    <point number="68" name="Voltage, Phase C-N" units="Volts" value="282.52" />
    <point number="69" name="Current, Phase A" units="Amps" value="432.25" />
    <point number="70" name="Current, Phase B" units="Amps" value="436.94" />
    <point number="71" name="Current, Phase C" units="Amps" value="395.77" />
    </record>
