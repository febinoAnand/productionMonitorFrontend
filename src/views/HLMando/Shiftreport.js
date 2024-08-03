import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilSearch } from '@coreui/icons';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CInputGroup,
  CFormSelect,
  CButton
} from '@coreui/react';
import BaseURL from 'src/assets/contants/BaseURL';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
  };
};

const Shiftreport = () => {
  const [startDate, setStartDate] = useState(null);
  const [shiftData, setShiftData] = useState([]);
  const [filteredShiftData, setFilteredShiftData] = useState([]);
  const [machineOptions, setMachineOptions] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [highlightedDates, setHighlightedDates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BaseURL}data/production-monitor/`, { headers: getAuthHeaders() });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        const shiftData = data.shift_wise_data || [];
        setShiftData(shiftData);
        setFilteredShiftData(shiftData); // Show all data initially

        const machineResponse = await fetch(`${BaseURL}devices/machine/`, { headers: getAuthHeaders() });
        if (!machineResponse.ok) {
          throw new Error(`HTTP error! Status: ${machineResponse.status}`);
        }
        const machineData = await machineResponse.json();

        const machineNames = Array.from(new Set(machineData.map(machine => machine.machine_name)));
        setMachineOptions(machineNames);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      const datesWithData = Array.from(new Set(
        shiftData
          .flatMap(shift => shift.groups.flatMap(group => group.machines))
          .filter(machine => machine.machine_name === selectedMachine)
          .map(machine => shiftData.find(shift => shift.groups.some(group => group.machines.includes(machine))).shift_date.split('T')[0])
      ));
      setHighlightedDates(datesWithData.map(date => new Date(date)));
    } else {
      setHighlightedDates([]);
    }
  }, [selectedMachine, shiftData]);

  useEffect(() => {
    if (!selectedMachine && !startDate) {
      setFilteredShiftData(shiftData); // Show all data if no machine or date is selected
    }
  }, [selectedMachine, startDate, shiftData]);

  const handleSearchClick = () => {
    if (!startDate || !selectedMachine) return;

    const formattedDate = format(startDate, 'yyyy-MM-dd');

    const filteredData = shiftData.filter(shift => {
      const shiftDate = shift.shift_date.split('T')[0];
      const matchDate = shiftDate === formattedDate;

      const filteredGroups = shift.groups.filter(group => 
        group.machines.some(machine => machine.machine_name === selectedMachine)
      );

      return matchDate && filteredGroups.length > 0;
    }).map(shift => ({
      ...shift,
      groups: shift.groups.filter(group => 
        group.machines.some(machine => machine.machine_name === selectedMachine)
      )
    }));

    setFilteredShiftData(filteredData);
  };

  const CustomInput = ({ value, onClick }) => (
    <div className="input-group" style={{ height: '38px', borderRadius: '0px' }}>
      <input
        type="text"
        className="form-control"
        value={value}
        onClick={onClick}
        readOnly
        placeholder="Select date"
        style={{ paddingRight: '30px', height: '38px', borderRadius: '0px' }}
      />
      <div className="input-group-append" style={{ borderRadius: '0px' }}>
        <CButton type="button" color="primary" onClick={onClick} style={{ height: '38px', borderRadius: '0px', backgroundColor: '#047BC4', borderColor: '#047BC4' }}>
          <CIcon icon={cilCalendar} />
        </CButton>
      </div>
    </div>
  );

  const renderShiftTable = (shift) => {
    // Create the shift label with prefix
    const shiftLabel = shift.shift_number !== null ? `Shift ${shift.shift_number}` : 'Shift N/A';

    return (
      <CCard className="mb-4" key={shift.shift_id}>
        <CCardHeader>
          <h5>{shift.shift_name ? shift.shift_name : shiftLabel}</h5>
        </CCardHeader>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <CCardBody>
            <CTable striped hover>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell scope="col">Si.No</CTableHeaderCell>
                  <CTableHeaderCell scope="col">GroupName</CTableHeaderCell>
                  <CTableHeaderCell scope="col">StartTime</CTableHeaderCell>
                  <CTableHeaderCell scope="col">EndTime</CTableHeaderCell>
                  <CTableHeaderCell scope="col">Production Count Actual</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {shift.groups.map((group, index) => (
                  <CTableRow key={group.group_id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{group.group_name}</CTableDataCell>
                    <CTableDataCell>{shift.shift_start_time}</CTableDataCell>
                    <CTableDataCell>{shift.shift_end_time}</CTableDataCell>
                    <CTableDataCell>{group.total_production_count_by_group}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </div>
      </CCard>
    );
  };

  return (
    <div className="page">
      <CRow className="mb-3">
        <CCol md={4}>
          <CInputGroup className="flex-nowrap mt-3 mb-4">
            <CFormSelect
              aria-label="Select Machine"
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
            >
              <option value="">Select Machine</option>
              {machineOptions.length > 0 ? (
                machineOptions.map((machine, index) => (
                  <option key={index} value={machine}>
                    {machine}
                  </option>
                ))
              ) : (
                <option value="">Loading machines...</option>
              )}
            </CFormSelect>
          </CInputGroup>
        </CCol>
        <CCol md={4} className="text-end">
          <CInputGroup className="flex-nowrap mt-3 mb-4">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              customInput={<CustomInput />}
              dateFormat="yyyy-MM-dd"
              popperPlacement="bottom-end"
              highlightDates={highlightedDates}
              onChangeRaw={(e) => setStartDate(new Date(e.target.value))}
            />
            <CButton
              type="button"
              color="primary"
              className="ms-2"
              style={{ height: '38px', borderRadius: '0px', backgroundColor: '#047BC4', borderColor: '#047BC4' }}
              onClick={handleSearchClick}
              disabled={!selectedMachine || !startDate}
            >
              <CIcon icon={cilSearch} />
            </CButton>
          </CInputGroup>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          {filteredShiftData.length > 0 ? (
            filteredShiftData.map(shift => (
              <div key={shift.shift_id}>
                {renderShiftTable(shift)}
              </div>
            ))
          ) : (
            <p>No data available for the selected machine and date.</p>
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default Shiftreport;
