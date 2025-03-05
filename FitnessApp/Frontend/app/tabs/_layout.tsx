import { Tabs, Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name = "index" options = { {
        headerTitle: "home/index page whatever",
        headerLeft: () => <></>
      } } />
      <Tabs.Screen name = "about" options = { {
        headerTitle: "about page",
        headerLeft: () => <></>
      } } />
      <Tabs.Screen name = "family_management" options = { {
        headerTitle: "Family Management",
        headerLeft: () => <></>
      } } />
    </Tabs>
  );
}