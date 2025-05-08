'use client';

import { Button, Card, Container, Group, LoadingOverlay, NumberInput, Stack, Switch, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import axios from 'axios';
import { LineChart } from '@mantine/charts';
import { ResponsiveContainer } from "recharts";

type Temperature = {
    pump: number;
    solar: number;
    security: number;
    rel: number;
};

type Status = {
  dif: number;
}

const backend = "https://solar-heat-backend.manuelselch.de";

export default function Dashboard() {
    const [data, setData] = useState<Temperature[]>([]);
    const [dif, setDif] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [timePeriod, setTimePeriod] = useState('hour');
    
    const fetchStatus = async () => {
        try {
          setLoading(true);
          const res = await axios.get<Status>(backend + "/temperatures/status");
          setDif(res.data.dif);
        } catch (err) {
          console.error('Failed to fetch status:', err);
        } finally {
          setLoading(false);
        }
    };

    const fetchTemperatures = async () => {
      try {
        const res = await axios.get<Temperature[]>(backend + "/temperatures");
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch temperatures:', err);
      } 
  };


    const updateDif = async () => {
        try {
          await axios.post(backend + "/temperatures/dif", { dif });
        } catch (err) {
          console.error('Failed to update dif:', err);
        }
    };

    const filterDataByTimePeriod = (data: Temperature[]) => {
      let filteredData;
  
      switch (timePeriod) {
        case 'hour':
          filteredData = data.slice(Math.max(data.length - 60, 0));
          break;
        case 'month':
          filteredData = data.slice(Math.max(data.length - 60*30, 0));
          break;
        case 'year':
          filteredData = data.slice(Math.max(data.length - 60*30*12, 0));
          break;
        default:
          filteredData = data;
      }
      return filteredData;
    };

    const chartData =  filterDataByTimePeriod(data).map((item, index) => ({
      ...item,
      date: index
    }));

    useEffect(() => {
      fetchStatus();
      fetchTemperatures();
    }, []);
    

    return (
        <Container>
            <LoadingOverlay visible={loading}/>
            <Title order={2}>Heinzungsteuerung Dashboard</Title>

            <Stack gap={100}>
              <Card shadow="md" padding="lg" mt="mt" withBorder>
                  <Text size="lg">🌡️ Temperatur</Text>
                  <Group mt="sm">
                    <Text>Solar: {data.at(-1)?.solar ?? 0} °C</Text>
                    <Text>Tank: {data.at(-1)?.pump ?? 0} °C</Text>
                    <Text>Security: {data.at(-1)?.security ?? 0} °C</Text>
                  </Group>

                  <Text size="lg" mt="md">⚙️ Status</Text>
                  <Switch checked={data.at(-1)?.rel==1} label={data.at(-1)?.rel==1 ? 'Pump is ON' : 'Pump is OFF'} readOnly />
                
                  <Text size="lg" mt="md">🔧 Differenz</Text>
                  <Group>
                    <NumberInput value={dif} onChange={(val) => setDif(Number(val) ?? 0)} min={0} max={20} />
                    <Button onClick={updateDif}>Save</Button>
                </Group>
              </Card>


              <Card shadow="md" padding="lg" mt="mt" withBorder>
                <Group mb="lg">
                  <Button onClick={() => setTimePeriod('hour')}  variant={timePeriod === 'hour' ? 'filled' : 'light'}>Last 60 Entries (Hour)</Button>
                  <Button onClick={() => setTimePeriod('month')} variant={timePeriod === 'month' ? 'filled' : 'light'}>Last Month</Button>
                  <Button onClick={() => setTimePeriod('year')}  variant={timePeriod === 'year' ? 'filled' : 'light'}>Last Year</Button>
                </Group>

                <LineChart
                    h={300}
                    withDots={false}
                    data={chartData}
                    dataKey="date"
                    series={[
                      { name: 'solar', color: 'yellow.6' },
                      { name: 'pump', color: 'blue.6' },
                      { name: 'security', color: 'red.6' },
                    ]}
                    strokeWidth={3}
                    curveType="linear"
                />
              </Card>

            </Stack>
            
        </Container>
    )
}