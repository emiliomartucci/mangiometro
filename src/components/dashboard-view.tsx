'use client';

import * as React from 'react';
import { DayLog, Meal } from '@/lib/types';
import { BarChart, PieChart, Info, AlertTriangle, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart as RechartsPieChart, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { getInsightsAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCorrelatedIngredients } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

type Insight = { insight: string };

type CorrelatedData = {
    ingredients: { item: string; frequency: number }[];
    allergens: { item: string; frequency: number }[];
};


export function DashboardView({ logs }: { logs: DayLog[] }) {
  const [insights, setInsights] = React.useState<Insight[]>([]);
  const [disclaimer, setDisclaimer] = React.useState('');
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(false);
  const [correlatedData, setCorrelatedData] = React.useState<CorrelatedData | null>(null);

  const handleGetInsights = async () => {
    setIsLoadingInsights(true);
    const result = await getInsightsAction();
    if (result) {
      setInsights(result.insights);
      setDisclaimer(result.disclaimer);
    }
    setIsLoadingInsights(false);
  };
  
  React.useEffect(() => {
    const fetchCorrelatedData = async () => {
        const data = await getCorrelatedIngredients(logs);
        setCorrelatedData(data);
    };
    fetchCorrelatedData();
  }, [logs]);


  const allergenData = React.useMemo(() => {
    const allergenCount: { [key: string]: number } = {};
    logs.forEach(log => {
      const dailyAllergens = new Set<string>();
      log.meals.forEach(meal => {
        meal.analysis?.allergens.forEach(allergen => {
          dailyAllergens.add(allergen);
        });
      });
      dailyAllergens.forEach(allergen => {
        allergenCount[allergen] = (allergenCount[allergen] || 0) + 1;
      });
    });
    return Object.entries(allergenCount)
      .map(([name, days]) => ({ name, days }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [logs]);

  const macroData = React.useMemo(() => {
    const totalMacros = { carbohydrates: 0, protein: 0, fat: 0 };
    logs.forEach(log => {
      log.meals.forEach(meal => {
        if (meal.analysis?.macros) {
          totalMacros.carbohydrates += meal.analysis.macros.carbohydrates;
          totalMacros.protein += meal.analysis.macros.protein;
          totalMacros.fat += meal.analysis.macros.fat;
        }
      });
    });
    return [
      { name: 'Carboidrati', value: totalMacros.carbohydrates, fill: 'hsl(var(--chart-1))' },
      { name: 'Proteine', value: totalMacros.protein, fill: 'hsl(var(--chart-2))' },
      { name: 'Grassi', value: totalMacros.fat, fill: 'hsl(var(--chart-3))' },
    ];
  }, [logs]);

  const chartConfig: ChartConfig = {
    days: {
      label: 'Giorni',
      color: 'hsl(var(--chart-1))',
    },
    value: {
        label: 'Grammi'
    }
  };

  return (
    <Tabs defaultValue="insights">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="insights"><Info className="w-4 h-4 mr-1" />Consigli</TabsTrigger>
        <TabsTrigger value="red-weeks"><AlertTriangle className="w-4 h-4 mr-1" />Settimane Rosse</TabsTrigger>
        <TabsTrigger value="allergens"><BarChart className="w-4 h-4 mr-1" />Allergeni</TabsTrigger>
        <TabsTrigger value="macros"><PieChart className="w-4 h-4 mr-1" />Macro</TabsTrigger>
      </TabsList>

      <TabsContent value="insights" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Consigli AI</CardTitle>
            <CardDescription>Ottieni spunti basati sui tuoi dati per capire le correlazioni tra cibo e benessere.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button onClick={handleGetInsights} disabled={isLoadingInsights}>
              {isLoadingInsights ? 'Analizzando...' : 'Genera Consigli'}
            </Button>
            {insights.length > 0 && (
                <div className="space-y-2 pt-4">
                    {insights.map((insight, index) => (
                        <Alert key={index}>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Insight</AlertTitle>
                            <AlertDescription>{insight.insight}</AlertDescription>
                        </Alert>
                    ))}
                    <p className="text-xs text-muted-foreground italic pt-2">{disclaimer}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="red-weeks" className="mt-4">
        <Card>
            <CardHeader>
                <CardTitle>Analisi Giorni "Rossi"</CardTitle>
                <CardDescription>Ingredienti e allergeni più frequenti nelle 48h precedenti i giorni con valutazione "malissimo".</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {correlatedData ? (
                    <>
                        <div>
                            <h4 className="font-semibold mb-2">Ingredienti Correlati</h4>
                            {correlatedData.ingredients.length > 0 ? (
                                <div className="space-y-1">
                                    {correlatedData.ingredients.map(item => (
                                        <div key={item.item} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                            <span>{item.item}</span>
                                            <Badge variant="secondary">Freq: {item.frequency}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">Nessun ingrediente correlato trovato.</p>}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Allergeni Correlati</h4>
                             {correlatedData.allergens.length > 0 ? (
                                <div className="space-y-1">
                                    {correlatedData.allergens.map(item => (
                                        <div key={item.item} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md">
                                            <span className="font-medium text-destructive">{item.item}</span>
                                            <Badge variant="destructive">Freq: {item.frequency}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">Nessun allergene correlato trovato.</p>}
                        </div>
                    </>
                ) : <p className="text-sm text-muted-foreground">Analisi in corso...</p>}
            </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="allergens" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Frequenza Allergeni</CardTitle>
            <CardDescription>Top 5 allergeni e % di giorni di esposizione.</CardDescription>
          </CardHeader>
          <CardContent>
            {allergenData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart accessibilityLayer data={allergenData} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                    <XAxis type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="days" fill="var(--color-days)" radius={4} />
                </RechartsBarChart>
                </ChartContainer>
            ) : <p className="text-muted-foreground">Nessun dato sugli allergeni disponibile.</p>}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="macros" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Macro Nutrienti</CardTitle>
            <CardDescription>Distribuzione totale di carboidrati, proteine e grassi.</CardDescription>
          </CardHeader>
          <CardContent>
            {macroData.some(d => d.value > 0) ? (
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie data={macroData} dataKey="value" nameKey="name" innerRadius={50}>
                    {macroData.map((entry, index) => (
                        <Cell key={`cell-index`} fill={entry.fill} />
                    ))}
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
            ): <p className="text-muted-foreground">Nessun dato sui macronutrienti disponibile.</p>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
