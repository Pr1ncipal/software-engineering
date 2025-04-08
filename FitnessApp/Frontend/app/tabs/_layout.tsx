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
      <Tabs.Screen name = "settings_page" options = { {
        headerTitle: "settings page",
        headerLeft: () => <></>
      } } />
      <Tabs.Screen name = "profile_page" options = { {
        headerTitle: "profile page",
        headerLeft: () => <></>
      } } />
      <Tabs.Screen name = "all_activities" options = { {
        headerTitle: "activities page (ref: profile)",
        headerLeft: () => <></>
      } } />
    </Tabs>
  );
}