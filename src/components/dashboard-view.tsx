'use client'

import * as React from 'react'
import { DayLog } from '@/lib/types'
import {
  BarChart,
  Info,
  AlertTriangle,
  Loader2,
  FlaskConical, // Debug Icon
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { getInsightsAction, debugAiAnalysis } from '@/lib/actions' // Import debug action
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'


type Insight = { insight: string }
type FoodInsightsOutput = {
    insights: Insight[];
    disclaimer: string;
    error?: string;
}

export function DashboardView({ initialLogs = [] }: { initialLogs?: DayLog[] }) {
  const [analysisResult, setAnalysisResult] = React.useState<FoodInsightsOutput | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(false)
  const [debugResult, setDebugResult] = React.useState<string | null>(null); // State for debug output
  const { toast } = useToast();

  const handleGetInsights = async () => {
    // ... (existing insight logic)
  }
  
  // ======================= DIAGNOSTIC HANDLER =======================
  const handleDebug = async () => {
    setDebugResult('Running test...');
    const result = await debugAiAnalysis();
    if (result.success) {
      setDebugResult(`SUCCESS! Analysis Data: ${JSON.stringify(result.data)}`);
    } else {
      // Display the exact error message from the server
      setDebugResult(`FAILED! Error: ${result.error}`);
    }
  };
  // =================================================================

  return (
    <Tabs defaultValue="insights">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="insights">
          <Info className="w-4 h-4 mr-1" />
          Consigli AI
        </TabsTrigger>
        <TabsTrigger value="charts">
          <BarChart className="w-4 h-4 mr-1" />
          Grafici
        </TabsTrigger>
        {/* Debug Tab */}
        <TabsTrigger value="debug">
          <FlaskConical className="w-4 h-4 mr-1" />
          Debug
        </TabsTrigger>
      </TabsList>

      <TabsContent value="insights" className="mt-4">
        {/* ... existing insights content ... */}
      </TabsContent>

      <TabsContent value="charts" className="mt-4 space-y-4">
        {/* ... existing charts content ... */}
      </TabsContent>
      
      {/* ======================= DEBUG UI ======================= */}
      <TabsContent value="debug" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Diagnostica AI</CardTitle>
            <CardDescription>
              Usa questo pulsante per testare la connessione con l'intelligenza artificiale e vedere l'errore esatto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleDebug}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Esegui Test di Analisi
            </Button>
            {debugResult && (
              <Alert variant={debugResult.startsWith('SUCCESS') ? 'default' : 'destructive'} className="mt-4">
                <AlertTitle>Risultato Diagnostica</AlertTitle>
                <AlertDescription className="break-words">
                  {debugResult}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      {/* ========================================================= */}

    </Tabs>
  )
}
