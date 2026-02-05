import {
    signal,
    Button,
    Card, CardHeader, CardBody, CardFooter,
    Badge,
    Input,
    Textarea,
    Select,
    Checkbox,
    Radio,
    Alert,
    Avatar,
    Table,
    Modal,
    Accordion,
    Tabs,
    Breadcrumbs,
    Pagination,
    Progress,
    Skeleton,
    Divider,
    Spinner,
    Container,
    Section,
    Dropdown,
    Tooltip,
    showToast,
    Drawer,
    Switch,
    FormGroup,
    Grid,
    Flex,
    Stack,
    type SelectOption,
    type TabItem,
    type AccordionItemType,
    type BreadcrumbItem,
    type TableColumn,
    type DropdownItem
} from '@/core/ui';

export function ComponentShowcase() {
    const [modalOpen, setModalOpen] = signal(false);
    const [drawerOpen, setDrawerOpen] = signal(false);
    const [currentPage, setCurrentPage] = signal(1);
    const [progressValue, setProgressValue] = signal(30);
    const [inputValue, setInputValue] = signal('');
    const [switchEnabled, setSwitchEnabled] = signal(false);

    const selectOptions: SelectOption[] = [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3' },
    ];

    const tabItems: TabItem[] = [
        { id: 'tab1', label: 'Overview', content: <p>Overview content goes here</p> },
        { id: 'tab2', label: 'Documentation', content: <p>Documentation content</p> },
        { id: 'tab3', label: 'Examples', content: <p>Example code snippets</p> },
    ];

    const accordionItems: AccordionItemType[] = [
        { id: '1', title: 'What is this component library?', content: <p>A comprehensive headless UI library using CSS variables.</p> },
        { id: '2', title: 'How do I customize colors?', content: <p>Modify CSS variables in your theme configuration.</p> },
        { id: '3', title: 'Is it accessible?', content: <p>Yes! All components include proper ARIA attributes.</p> },
    ];

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Components', href: '/components' },
        { label: 'Showcase' },
    ];

    const tableColumns: TableColumn[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'role', label: 'Role' },
        {
            key: 'status',
            label: 'Status',
            render: (value: string) => (
                <Badge variant={value === 'Active' ? 'success' : 'secondary'}>{value}</Badge>
            )
        },
    ];

    const tableData = [
        { name: 'John Doe', role: 'Developer', status: 'Active' },
        { name: 'Jane Smith', role: 'Designer', status: 'Active' },
        { name: 'Bob Johnson', role: 'Manager', status: 'Inactive' },
    ];

    const dropdownItems: DropdownItem[] = [
        { id: 'profile', label: 'Profile', onClick: () => showToast({ message: 'Profile clicked' }) },
        { id: 'settings', label: 'Settings', onClick: () => showToast({ message: 'Settings clicked' }) },
        { id: 'logout', label: 'Logout', variant: 'destructive', onClick: () => showToast({ message: 'Logout clicked', variant: 'destructive' }) },
    ];

    return (
        <Container size="xl">
            <Section padding="lg">
                {/* Header */}
                <div class="mb-12 text-center">
                    <h1 class="text-4xl font-bold mb-4">UI Component Library</h1>
                    <p class="text-lg text-[hsl(var(--muted-foreground))]">
                        Comprehensive headless components built with CSS variables
                    </p>
                    <Breadcrumbs items={breadcrumbItems} class="justify-center mt-4" />
                </div>

                {/* Layout & Grid Section */}
                <Card class="mb-8">
                    <CardHeader>
                        <h2 class="text-2xl font-semibold">Layout & Grid</h2>
                    </CardHeader>
                    <CardBody>
                        <Stack gap="md">
                            <div>
                                <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Flex Row with Gap</h3>
                                <Flex gap="md" align="center" wrap="wrap">
                                    <div class="p-4 bg-[hsl(var(--muted))] rounded">Item 1</div>
                                    <div class="p-4 bg-[hsl(var(--muted))] rounded">Item 2</div>
                                    <div class="p-4 bg-[hsl(var(--muted))] rounded">Item 3</div>
                                </Flex>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Responsive Grid</h3>
                                <Grid cols={1} sm={2} md={3} gap="md">
                                    <div class="p-4 border border-[hsl(var(--border))] rounded">Grid Item 1</div>
                                    <div class="p-4 border border-[hsl(var(--border))] rounded">Grid Item 2</div>
                                    <div class="p-4 border border-[hsl(var(--border))] rounded">Grid Item 3</div>
                                </Grid>
                            </div>
                        </Stack>
                    </CardBody>
                </Card>

                {/* Buttons & Overlays Section */}
                <Card class="mb-8">
                    <CardHeader>
                        <h2 class="text-2xl font-semibold">Buttons & Overlays</h2>
                    </CardHeader>
                    <CardBody>
                        <Stack gap="lg">
                            <div>
                                <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Solid Variants</h3>
                                <Flex gap="sm" wrap="wrap">
                                    <Button variant="primary">Primary</Button>
                                    <Button variant="secondary">Secondary</Button>
                                    <Button variant="success">Success</Button>
                                    <Button variant="destructive">Destructive</Button>
                                    <Button variant="warning">Warning</Button>
                                    <Button variant="info">Info</Button>
                                </Flex>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Outline & Ghost</h3>
                                <Flex gap="sm" wrap="wrap">
                                    <Button variant="primary" mode="outline">Outline</Button>
                                    <Button variant="success" mode="ghost">Ghost</Button>
                                    <Button variant="destructive" mode="subtle">Subtle</Button>
                                    <Button variant="primary" mode="link">Link</Button>
                                </Flex>
                            </div>
                            <div>
                                <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Interactive Overlays</h3>
                                <Flex gap="sm" wrap="wrap">
                                    <Dropdown items={dropdownItems}>
                                        <Button variant="secondary">Open Dropdown</Button>
                                    </Dropdown>
                                    <Tooltip content="This is a helpful tooltip">
                                        <Button variant="info" mode="outline">Hover for Tooltip</Button>
                                    </Tooltip>
                                    <Button variant="success" onClick={() => showToast({
                                        message: 'This is a success notification!',
                                        variant: 'success'
                                    })}>
                                        Show Toast
                                    </Button>
                                </Flex>
                            </div>
                        </Stack>
                    </CardBody>
                </Card>

                {/* Form Controls Section */}
                <Card class="mb-8">
                    <CardHeader>
                        <h2 class="text-2xl font-semibold">Form Controls</h2>
                    </CardHeader>
                    <CardBody>
                        <Grid cols={1} md={2} gap="xl">
                            <Stack gap="md">
                                <FormGroup label="Full Name" helperText="Please enter your full name">
                                    <Input
                                        placeholder="John Doe"
                                        value={inputValue()}
                                        onInput={(e: any) => setInputValue(e.target.value)}
                                    />
                                </FormGroup>
                                <FormGroup label="Bio">
                                    <Textarea placeholder="Tell us about yourself..." rows={3} />
                                </FormGroup>
                            </Stack>
                            <Stack gap="md">
                                <FormGroup label="Occupation">
                                    <Select options={selectOptions} placeholder="Select your role" />
                                </FormGroup>
                                <div class="space-y-4">
                                    <Switch
                                        label="Enable notifications"
                                        checked={switchEnabled}
                                        onChange={(e: any) => setSwitchEnabled(e.target.checked)}
                                    />
                                    <Flex gap="md">
                                        <Checkbox label="Remember me" id="remember" />
                                        <Radio label="Standard" name="plan" id="std" value="standard" defaultChecked />
                                        <Radio label="Premium" name="plan" id="prm" value="premium" />
                                    </Flex>
                                </div>
                            </Stack>
                        </Grid>
                    </CardBody>
                </Card>

                {/* Data Display Section */}
                <Card class="mb-8">
                    <CardHeader>
                        <h2 class="text-2xl font-semibold">Data Display</h2>
                    </CardHeader>
                    <CardBody>
                        <Stack gap="lg">
                            <div>
                                <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-4">Users Table</h3>
                                <Table
                                    columns={tableColumns}
                                    data={tableData}
                                    striped
                                    hoverable
                                    bordered
                                />
                            </div>
                            <Flex gap="xl" align="start" wrap="wrap">
                                <Stack gap="sm">
                                    <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))]">Avatars</h3>
                                    <Flex gap="sm">
                                        <Avatar name="John Doe" size="sm" />
                                        <Avatar name="Jane Smith" size="md" />
                                        <Avatar name="Bob Johnson" size="lg" />
                                        <Avatar name="Alice" size="xl" shape="rounded" />
                                    </Flex>
                                </Stack>
                                <Stack gap="sm" class="flex-1 min-w-[300px]">
                                    <h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))]">Progress</h3>
                                    <Progress value={progressValue} max={100} showLabel />
                                    <Flex gap="sm">
                                        <Button size="xs" onClick={() => setProgressValue(Math.max(0, progressValue() - 10))}>-10</Button>
                                        <Button size="xs" onClick={() => setProgressValue(Math.min(100, progressValue() + 10))}>+10</Button>
                                    </Flex>
                                </Stack>
                            </Flex>
                        </Stack>
                    </CardBody>
                </Card>

                {/* Navigation Section */}
                <Card class="mb-8">
                    <CardHeader>
                        <h2 class="text-2xl font-semibold">Navigation & Disclosure</h2>
                    </CardHeader>
                    <CardBody>
                        <Tabs items={tabItems} class="mb-8" />
                        <Divider text="More Disclosure Components" class="mb-8" />
                        <Grid cols={1} md={2} gap="xl">
                            <Accordion items={accordionItems} />
                            <Stack gap="md">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={10}
                                    onPageChange={setCurrentPage}
                                />
                                <Alert variant="warning" dismissible>
                                    Note: Some navigation elements are for demonstration only.
                                </Alert>
                            </Stack>
                        </Grid>
                    </CardBody>
                </Card>

                {/* More Overlays Section */}
                <Card class="mb-8">
                    <CardHeader>
                        <h2 class="text-2xl font-semibold">Modals & Drawers</h2>
                    </CardHeader>
                    <CardBody>
                        <Flex gap="md">
                            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
                            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
                        </Flex>

                        <Modal
                            open={modalOpen}
                            onClose={() => setModalOpen(false)}
                            title="Welcome to the Library"
                        >
                            <p class="mb-6">This modal demonstrates the standard dialog component with a backdrop and keyboard support.</p>
                            <Flex justify="end" gap="sm">
                                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                                <Button onClick={() => setModalOpen(false)}>Got it</Button>
                            </Flex>
                        </Modal>

                        <Drawer
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                            title="Settings Panel"
                        >
                            <Stack gap="md" class="p-4">
                                <p>This is a side drawer for complex configurations or additional context.</p>
                                <Switch label="Enable Dark Mode" />
                                <Switch label="Auto-update" checked />
                            </Stack>
                        </Drawer>
                    </CardBody>
                </Card>

                {/* Footer */}
                <div class="text-center py-8 text-[hsl(var(--muted-foreground))]">
                    <p>Built with ❤️ using headless components and CSS variables</p>
                    <p class="text-sm mt-2">All components are themeable and accessible</p>
                </div>
            </Section>
        </Container>
    );
}
