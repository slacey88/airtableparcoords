import React, {useState, useEffect} from 'react';
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
    const filteredFieldId = globalConfig.get('filteredFieldId');

    const table = base.getTableByIdIfExists(tableId);
    const view = table ? table.getViewByIdIfExists(viewId) : null;  
    const filterField = table ? table.getFieldByIdIfExists(filteredFieldId) : null;
 
    const keys = []; 
    for (let field of table.fields) {  
        keys.push({ name: field.name, type: field.type }); 
    } 

    const filteredKeys = keys.filter(key => key.type === 'number').map(key => key.name);

    const records = useRecords(view);
 
    const data = records.map(record => {   
        return { id: record.id, ...keys.reduce((o, key) => ({ ...o, [key.name]: record.getCellValue(key.name)}), {}) }; 
    });
  
    const chunkArray = (array, chunkSize) => {
        return Array.from(
            { length: Math.ceil(array.length / chunkSize) },
            (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
        );
    }   

    const filtered_string = true;
    const unfiltered_string = false;

    const onFiltered = async (filteredRecords) => {

        try { 
 
            const filtered = records.map(record => {   
                return { id: record.id, filtered: record.getCellValue(filterField) }; 
            }
            ).filter(d => d.filtered === filtered_string);
 
            // Max 50 updates per batch on Airtable API, remove current filtered rows
            await Promise.all(chunkArray(filtered, 50).map(async (elements) => {  
                await table.updateRecordsAsync(elements.map(record => {  
                    return { id: record.id, fields: {[filterField.name]: unfiltered_string } 
                }})); 
            }));    

            if (filteredRecords.length === records.length) {
                return;
            }

            // Add filtered rows 
            await Promise.all(chunkArray(filteredRecords, 50).map(async (elements) => {  
            
                await table.updateRecordsAsync(elements.map(record => {  
                    return { id: record.id, fields: {[filterField.name]: filtered_string } 
                }})); 
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
                        <Chart data={data} keys={filteredKeys} width={parent.width} onFiltered={onFiltered} /> 
                    )
                }}
            </ParentSize>   

            <Box padding={3} >  
                <FormField label="Table">
                    <TablePickerSynced globalConfigKey="selectedTableId" />
                </FormField>
                <FormField label="View">
                    <ViewPickerSynced table={table} globalConfigKey="selectedViewId" />
                </FormField> 
                <FormField label="Field" marginBottom={0}>
                    <FieldPickerSynced
                        table={table}
                        globalConfigKey="filteredFieldId"
                        placeholder="Pick a filter field..." 
                    />
                </FormField>
            </Box>
        </div>
    );
} 