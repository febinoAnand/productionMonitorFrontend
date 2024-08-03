import React, { useState, useEffect, forwardRef } from 'react';
import {
  CCol,
  CRow,
  CInputGroup,
  CFormInput,
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  //CFormCheck
} from '@coreui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilSearch } from '@coreui/icons';
import jsPDF from 'jspdf';
import axios from 'axios';
import BaseURL from 'src/assets/contants/BaseURL'; 
import 'jspdf-autotable';


const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); 
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json'
  };
};

const Download = () => {
  const [startDate4, setStartDate4] = useState(new Date());
  const [endDate4, setEndDate4] = useState(new Date());
  const [selectedMachines, setSelectedMachines] = useState({});
  const [machinesByGroup, setMachinesByGroup] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get(`${BaseURL}/devices/machinegroup/`, { headers: getAuthHeaders() });
        console.log('API Response:', response.data); 
        const data = response.data;
  
        if (Array.isArray(data)) {
          const initialSelectedMachines = data.reduce((acc, group) => {
            group.machines.forEach(machine => {
              acc[machine.machine_id] = false;
            });
            return acc;
          }, {});
  
          setMachinesByGroup(data);
          setSelectedMachines(initialSelectedMachines);
        } else {
          console.error('Unexpected API response format:', data);
        }
      } catch (error) {
        console.error('Error fetching machine data:', error);
      }
    };
  
    fetchMachines();
  }, []);
  

  //const handleMachineChange = (e) => {
    //const { id, checked } = e.target;
    //setSelectedMachines(prevState => ({ ...prevState, [id]: checked }));
  //};
  

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const generatePDF = () => {
    const selectedMachineIds = Object.keys(selectedMachines).filter(machineId => selectedMachines[machineId]);
    if (selectedMachineIds.length === 0) {
      alert('Please select at least one machine to generate the PDF.');
      return;
    }
  
    if (!apiData || !apiData.machines) {
      console.error('Invalid data for PDF generation:', apiData);
      return;
    }
  
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.text('Production Report', 10, 10);
  
    apiData.machines.forEach((machine) => {
      doc.text(`Machine ID : ${machine.machine_id}`, 10, doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 20);
  
      const header = [
        [{ content: 'Shifts', colSpan: 2 }, { content: 'Date/Time', colSpan: 3 }, { content: `${machine.machine_id}`, colSpan: 3 }],
        ['', 'Date', 'From Time', 'To Time', 'Count', 'Target', 'Total']
      ];
  
      const dataRows = machine.shifts.map((shift) => [
        shift.shift_name,
        shift.date,
        shift.shift_start_time,
        shift.shift_end_time,
        shift.production_count,
        shift.target_production,
        shift.total
      ]);
  
      doc.autoTable({
        head: header,
        body: dataRows,
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : 30,
        margin: { top: 30, left: 10, right: 10 },
        styles: {
          cellPadding: 2,
          fontSize: 8,
          overflow: 'linebreak',
          cellWidth: 'auto'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
        },
        tableWidth: 'auto',
        theme: 'striped',
        pageBreak: 'avoid'
      });
    });
  
    doc.save('shift_report.pdf');
  };
  

  const generateCSV = async () => {
    const selectedMachineIds = Object.keys(selectedMachines).filter(machineId => selectedMachines[machineId]);
    if (selectedMachineIds.length === 0) {
      alert('Please select at least one machine to generate the CSV.');
      return;
    }
  
    const data = {
      machine_ids: selectedMachineIds,
      from_date: formatDate(startDate4),
      to_date: formatDate(endDate4)
    };
  
    try {
      const response = await axios.post(`${BaseURL}/data/table-report/`, data, { headers: getAuthHeaders() });
      const apiData = response.data;
      setApiData(apiData);
  
      const header = ['SHIFT', ' ', 'Date/Time', '', ''];
      const subHeader = ['', 'Date', 'From', 'To'];
  
      selectedMachineIds.forEach((machineId) => {
        header.push(`${machineId}`, '', '');
        subHeader.push('count', 'target', 'total');
      });
  
      const dataRows = [header.join(','), subHeader.join(',')];
  
      apiData.machines.forEach(machine => {
        machine.shifts.forEach((shift) => {
          const row = [
            shift.shift_name,
            `${shift.date} ${shift.time}`,
            shift.shift_start_time,
            shift.shift_end_time,
          ];
  
          selectedMachineIds.forEach((machineId) => {
            const machineData = apiData.machines.find(m => m.machine_id === machineId);
            if (machineData) {
              const shiftData = machineData.shifts.find(s => s.date === shift.date && s.shift_name === shift.shift_name);
              if (shiftData) {
                row.push(shiftData.production_count, shiftData.target_production, shiftData.total);
              } else {
                row.push('', '', '');
              }
            } else {
              row.push('', '', '');
            }
          });
  
          dataRows.push(row.join(','));
        });
      });
  
      const csv = dataRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'Shift_Table.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating CSV:', error);
    }
  };
  

  const handleSearch = async () => {
     if (endDate4 < startDate4) {
      setErrorMessage('pls select the date correctly');
      return;
    }
    setErrorMessage('');

    const selectedMachineIds = Object.keys(selectedMachines).filter(machineId => selectedMachines[machineId]);
    const data = {
      machine_ids: selectedMachineIds,
      from_date: formatDate(startDate4),
      to_date: formatDate(endDate4)
    };
    console.log('Posting data:', data);

    try {
      const response = await axios.post(`${BaseURL}/data/table-report/`, data, { headers: getAuthHeaders() });
      console.log('API Response -->:', response.data);
      setApiData(response.data); 
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };
  const handleStartDateChange = (date) => {
    setStartDate4(date);
    if (endDate4 >= date) {
      setErrorMessage(''); 
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate4(date);
    if (date >= startDate4) {
      setErrorMessage(''); 
    }
  };

  return (
    <div className="page">
      <CRow className="mb-3">
        {errorMessage && (
          <div style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</div>
        )}
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <h4>Machines</h4>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol md={6} className="text-end">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', marginRight: '425px' }}>From Date</div>
                    <CInputGroup>
                      <DatePicker
                        selected={startDate4}
                        onChange={handleStartDateChange}
                        customInput={<CustomInput />}
                        dateFormat="dd/MM/yyyy"
                        popperPlacement="bottom-end"
                      />
                    </CInputGroup>
                  </div>
                </CCol>
                <CCol md={6} className="text-end">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', marginRight: '445px' }}>To Date</div>
                    <CInputGroup>
                      <DatePicker
                        selected={endDate4}
                        onChange={handleEndDateChange}
                        customInput={<CustomInput />}
                        dateFormat="dd/MM/yyyy"
                        popperPlacement="bottom-end"
                      />
                      <CButton
                        type="button"
                        color="primary"
                        className="ms-2"
                        style={{ height: '38px', borderRadius: '0px', backgroundColor: '#047BC4', borderColor: '#047BC4' }}
                        onClick={handleSearch}
                      >
                        <CIcon icon={cilSearch} />
                      </CButton>
                    </CInputGroup>
                  </div>
                </CCol>
              </CRow>
              <CRow className="justify-content-center mt-5">
                <CCol md={3} className="text-center">
                  <CButton type="button" color="primary" variant='outline' className="mb-3" style={{ width: '100%' }} onClick={generatePDF}>
                   Summary Report
                  </CButton>
                  <CButton type="button" color="primary" variant='outline' style={{ width: '100%' }} onClick={generateCSV}>
                  Shiftwise Report
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

const CustomInput = forwardRef((props, ref) => (
  <CInputGroup>
    <CFormInput
      value={props.value}
      onClick={props.onClick}
      readOnly
      ref={ref}
      style={{ paddingRight: '30px', height: '38px', borderRadius: '0px' }}
    />
     <CButton 
      type="button" 
      color="secondary" 
      onClick={props.onClick}
      style={{ backgroundColor: '#047BC4', borderColor: '#047BC4' }}
    >
      <CIcon icon={cilCalendar} style={{ color: '#FFFFFF' }} />
    </CButton>
  </CInputGroup>
));
CustomInput.displayName = 'CustomInput';

export default Download;
