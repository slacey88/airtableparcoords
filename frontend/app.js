import React, {useState} from 'react';
import {
    useBase,
    useRecords,
    useGlobalConfig,
    expandRecord,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    FormField,
    Input,
    Button,
    Box,
    Icon,
} from '@airtable/blocks/ui'; 
import Chart from './chart';
import { ParentSize } from '@visx/responsive'; 

export default function App() {
    const base = useBase();

    // Read the user's choice for which table and view to use from globalConfig.
    const globalConfig = useGlobalConfig();
    const tableId = globalConfig.get('selectedTableId');
    const viewId = globalConfig.get('selectedViewId'); 

    const table = base.getTableByIdIfExists(tableId);
    const view = table ? table.getViewByIdIfExists(viewId) : null; 
 
    const keys = []; 
    for (let field of table.fields) { 
        if (field.type === 'number') { 
            keys.push(field.name);
        }
    } 

    const records = useRecords(view);
 
    const data = records.map(record => {   
        return { id: record.id, ...keys.reduce((o, key) => ({ ...o, [key]: record.getCellValue(key)}), {}) }; 
    });
  
    const chunkArray = (array, chunkSize) => {
        return Array.from(
            { length: Math.ceil(array.length / chunkSize) },
            (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
        );
    }

    const onFiltered = async (filteredRecords) => {
            try {
            
                const toUpdate = [];

                filteredRecords.forEach(element => {
                    
                    const record = records.find(record => record.id === element.id); 
                    const permissionCheck = table.checkPermissionsForUpdateRecord(record, {
                        "filtered": undefined,
                    }); 

                    if (!permissionCheck.hasPermission || !record) return;

                    toUpdate.push({ id: record.id, fields: {'filtered': filteredRecords.length === records.length ? '' : '1'} });  
                });
 
                await Promise.all(chunkArray(toUpdate, 30).map(async (chunk) => { 
                    await table.updateRecordsAsync(chunk); 
                }));

            } catch (error) { 
                console.log(error);
            }
    }; 

    return (
        <div> 
            <ParentSize>
                {parent => {
                    return ( 
                        <Chart data={data} keys={keys} width={parent.width} onFiltered={onFiltered} /> 
                    )
                }}
            </ParentSize>   

            <Box padding={3} style={{visibility: 'hidden'}}>  
                <FormField label="Table">
                    <TablePickerSynced globalConfigKey="selectedTableId" />
                </FormField>
                <FormField label="View">
                    <ViewPickerSynced table={table} globalConfigKey="selectedViewId" />
                </FormField> 
            </Box>
        </div>
    );
} 